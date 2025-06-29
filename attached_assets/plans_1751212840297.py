from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from ..models.user import User
from ..services.auth.auth_service import AuthService
from ..services.workout.workout_generator import WorkoutGenerator

router = APIRouter(prefix="/workout-plans", tags=["workout-plans"])
auth_service = AuthService()
workout_generator = WorkoutGenerator()

@router.get("/", response_model=List[Dict[str, Any]])
async def get_user_plans(current_user: User = Depends(auth_service.get_current_user)):
    """Ottiene tutti i piani di allenamento dell'utente."""
    return await workout_generator.get_user_plans(current_user.id)

@router.post("/generate", response_model=Dict[str, Any])
async def generate_workout_plan(
    plan_data: Dict[str, Any],
    current_user: User = Depends(auth_service.get_current_user)
):
    """Genera un nuovo piano di allenamento personalizzato."""
    return await workout_generator.generate_weekly_plan(current_user.id, plan_data)

@router.get("/{plan_id}", response_model=Dict[str, Any])
async def get_plan_details(
    plan_id: int,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Ottiene i dettagli di un piano di allenamento specifico."""
    return await workout_generator.get_plan_details(plan_id, current_user.id)

@router.put("/{plan_id}", response_model=Dict[str, Any])
async def update_plan(
    plan_id: int,
    plan_data: Dict[str, Any],
    current_user: User = Depends(auth_service.get_current_user)
):
    """Aggiorna un piano di allenamento esistente."""
    return await workout_generator.update_plan(plan_id, plan_data, current_user.id)

@router.delete("/{plan_id}")
async def delete_plan(
    plan_id: int,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Elimina un piano di allenamento."""
    await workout_generator.delete_plan(plan_id, current_user.id)
    return {"status": "success"}
