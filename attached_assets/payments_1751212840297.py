from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from ..models.user import User
from ..services.auth.auth_service import AuthService
from ..services.payment.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["payments"])
auth_service = AuthService()
payment_service = PaymentService()

@router.get("/subscriptions", response_model=Dict[str, Any])
async def get_user_subscriptions(current_user: User = Depends(auth_service.get_current_user)):
    """Ottiene gli abbonamenti attivi dell'utente."""
    return await payment_service.get_user_subscriptions(current_user.id)

@router.post("/create-subscription", response_model=Dict[str, Any])
async def create_subscription(
    subscription_data: Dict[str, Any],
    current_user: User = Depends(auth_service.get_current_user)
):
    """Crea un nuovo abbonamento."""
    return await payment_service.create_subscription(current_user.id, subscription_data)

@router.get("/plans", response_model=Dict[str, Any])
async def get_subscription_plans():
    """Ottiene i piani di abbonamento disponibili."""
    return await payment_service.get_subscription_plans()

@router.post("/cancel-subscription/{subscription_id}", response_model=Dict[str, Any])
async def cancel_subscription(
    subscription_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Cancella un abbonamento attivo."""
    return await payment_service.cancel_subscription(current_user.id, subscription_id)

@router.post("/payment-webhook", response_model=Dict[str, Any])
async def payment_webhook(event_data: Dict[str, Any]):
    """Webhook per eventi di pagamento da Stripe."""
    return await payment_service.handle_payment_webhook(event_data)
