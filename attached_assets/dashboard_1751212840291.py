from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from ..models.user import User
from ..services.auth.auth_service import AuthService
from ..services.dashboard.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
auth_service = AuthService()
dashboard_service = DashboardService()

@router.get("/stats", response_model=Dict[str, Any])
async def get_dashboard_stats(current_user: User = Depends(auth_service.get_current_user)):
    """Ottiene le statistiche principali per la dashboard dell'utente."""
    return await dashboard_service.get_user_stats(current_user.id)

@router.get("/performance", response_model=List[Dict[str, Any]])
async def get_performance_data(current_user: User = Depends(auth_service.get_current_user)):
    """Ottiene i dati di performance per i grafici della dashboard."""
    return await dashboard_service.get_performance_data(current_user.id)

@router.get("/recent-sessions", response_model=List[Dict[str, Any]])
async def get_recent_sessions(current_user: User = Depends(auth_service.get_current_user)):
    """Ottiene le sessioni di allenamento recenti dell'utente."""
    return await dashboard_service.get_recent_sessions(current_user.id)

@router.get("/progress/{goal_id}", response_model=Dict[str, Any])
async def get_goal_progress(goal_id: int, current_user: User = Depends(auth_service.get_current_user)):
    """Ottiene il progresso verso un obiettivo specifico."""
    return await dashboard_service.get_goal_progress(current_user.id, goal_id)
