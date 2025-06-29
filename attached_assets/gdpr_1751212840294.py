from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from ..models.user import User
from ..services.auth.auth_service import AuthService
from ..services.gdpr.gdpr_service import GDPRService

router = APIRouter(prefix="/gdpr", tags=["gdpr"])
auth_service = AuthService()
gdpr_service = GDPRService()

@router.get("/data", response_model=Dict[str, Any])
async def get_user_data(current_user: User = Depends(auth_service.get_current_user)):
    """Ottiene tutti i dati personali dell'utente (diritto di accesso)."""
    return await gdpr_service.get_user_data(current_user.id)

@router.post("/data/export", response_model=Dict[str, Any])
async def export_user_data(current_user: User = Depends(auth_service.get_current_user)):
    """Esporta tutti i dati personali dell'utente in formato JSON."""
    return await gdpr_service.export_user_data(current_user.id)

@router.delete("/data", response_model=Dict[str, Any])
async def delete_user_data(current_user: User = Depends(auth_service.get_current_user)):
    """Elimina tutti i dati personali dell'utente (diritto all'oblio)."""
    return await gdpr_service.delete_user_data(current_user.id)

@router.put("/consent", response_model=Dict[str, Any])
async def update_user_consent(
    consent_data: Dict[str, bool],
    current_user: User = Depends(auth_service.get_current_user)
):
    """Aggiorna i consensi dell'utente."""
    return await gdpr_service.update_user_consent(current_user.id, consent_data)

@router.get("/consent", response_model=Dict[str, Any])
async def get_user_consent(current_user: User = Depends(auth_service.get_current_user)):
    """Ottiene i consensi attuali dell'utente."""
    return await gdpr_service.get_user_consent(current_user.id)
