from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from ..models.user import User
from ..services.auth.auth_service import AuthService
from ..services.wearable.wearable_service import WearableService

router = APIRouter(prefix="/wearable", tags=["wearable"])
auth_service = AuthService()
wearable_service = WearableService()

@router.get("/integrations", response_model=Dict[str, Any])
async def get_wearable_integrations(current_user: User = Depends(auth_service.get_current_user)):
    """Ottiene le integrazioni wearable dell'utente."""
    return await wearable_service.get_user_integrations(current_user.id)

@router.post("/connect/fitbit", response_model=Dict[str, Any])
async def connect_fitbit(
    auth_data: Dict[str, str],
    current_user: User = Depends(auth_service.get_current_user)
):
    """Connette l'account Fitbit dell'utente."""
    return await wearable_service.connect_fitbit(current_user.id, auth_data)

@router.post("/sync", response_model=Dict[str, Any])
async def sync_wearable_data(current_user: User = Depends(auth_service.get_current_user)):
    """Sincronizza i dati dai dispositivi wearable."""
    return await wearable_service.sync_health_data(current_user.id)

@router.get("/health-data", response_model=Dict[str, Any])
async def get_health_data(current_user: User = Depends(auth_service.get_current_user)):
    """Ottiene i dati di salute sincronizzati dai dispositivi wearable."""
    return await wearable_service.get_health_data(current_user.id)

@router.delete("/disconnect/{provider}", response_model=Dict[str, Any])
async def disconnect_wearable(
    provider: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Disconnette un'integrazione wearable."""
    return await wearable_service.disconnect_provider(current_user.id, provider)
