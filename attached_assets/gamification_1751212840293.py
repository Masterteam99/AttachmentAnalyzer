from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..models.user import User
from ..models.achievement import Achievement, AchievementCreate
from ..services.auth.auth_service import AuthService
from ..services.gamification.gamification_service import GamificationService

router = APIRouter(prefix="/gamification", tags=["gamification"])
auth_service = AuthService()
gamification_service = GamificationService()

@router.get("/achievements", response_model=List[Achievement])
async def get_achievements(current_user: User = Depends(auth_service.get_current_user)):
    return await gamification_service.get_user_achievements(current_user.id)

@router.get("/streak", response_model=dict)
async def get_streak(current_user: User = Depends(auth_service.get_current_user)):
    return await gamification_service.get_user_streak(current_user.id)

@router.post("/check-session", response_model=List[Achievement])
async def check_session_achievements(
    session_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    return await gamification_service.check_session_achievements(current_user.id, session_id)
