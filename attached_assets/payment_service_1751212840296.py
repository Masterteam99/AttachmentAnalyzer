import stripe
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from ..models.database import database
from ..config.settings import settings

class PaymentService:
    def __init__(self):
        # Configura Stripe con la chiave API
        if settings.STRIPE_API_KEY:
            stripe.api_key = settings.STRIPE_API_KEY
    
    async def get_user_subscriptions(self, user_id: int) -> Dict[str, Any]:
        """
        Ottiene gli abbonamenti attivi dell'utente.
        
        Args:
            user_id: ID dell'utente
            
        Returns:
            Dizionario con gli abbonamenti attivi
        """
        subscriptions = await database.fetch_all(
            """
            SELECT id, stripe_id, plan, status, start_date, end_date
            FROM subscriptions
            WHERE user_id = :user_id
            ORDER BY start_date DESC
            """,
            {"user_id": user_id}
        )
        
        result = {
            "subscriptions": []
        }
        
        for sub in subscriptions:
            result["subscriptions"].append({
                "id": sub["id"],
                "stripe_id": sub["stripe_id"],
                "plan": sub["plan"],
                "status": sub["status"],
                "start_date": sub["start_date"].isoformat(),
                "end_date": sub["end_date"].isoformat() if sub["end_date"] else None
            })
        
        return result
    
    async def create_subscription(self, user_id: int, subscription_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crea un nuovo abbonamento.
        
        Args:
            user_id: ID dell'utente
            subscription_data: Dati dell'abbonamento
            
        Returns:
            Dettagli dell'abbonamento creato
        """
        plan_id = subscription_data.get("plan_id")
        payment_method_id = subscription_data.get("payment_method_id")
        
        if not plan_id or not payment_method_id:
            raise ValueError("Piano e metodo di pagamento richiesti")
        
        # Ottieni piano
        plan = await self._get_plan_by_id(plan_id)
        if not plan:
            raise ValueError(f"Piano {plan_id} non trovato")
        
        # In una implementazione reale, qui ci sarebbe l'integrazione con Stripe
        # Per questa implementazione, simuliamo il processo
        
        # Simula ID Stripe
        stripe_id = f"sub_{user_id}_{datetime.now().timestamp()}"
        
        # Calcola date
        start_date = datetime.now()
        end_date = start_date + timedelta(days=30)  # Abbonamento mensile
        
        # Salva abbonamento nel database
        subscription_id = await database.execute(
            """
            INSERT INTO subscriptions
            (user_id, stripe_id, plan, status, start_date, end_date)
            VALUES (:user_id, :stripe_id, :plan, :status, :start_date, :end_date)
            RETURNING id
            """,
            {
                "user_id": user_id,
                "stripe_id": stripe_id,
                "plan": plan["name"],
                "status": "active",
                "start_date": start_date,
                "end_date": end_date
            }
        )
        
        return {
            "id": subscription_id,
            "stripe_id": stripe_id,
            "plan": plan["name"],
            "status": "active",
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }
    
    async def get_subscription_plans(self) -> Dict[str, Any]:
        """
        Ottiene i piani di abbonamento disponibili.
        
        Returns:
            Dizionario con i piani disponibili
        """
        # In una implementazione reale, questi sarebbero recuperati da Stripe
        # Per questa implementazione, definiamo piani statici
        plans = [
            {
                "id": "basic",
                "name": "Base",
                "description": "Accesso alle funzionalità di base",
                "price": 9.99,
                "currency": "EUR",
                "interval": "month",
                "features": [
                    "Analisi del movimento",
                    "Dashboard base",
                    "3 piani di allenamento"
                ]
            },
            {
                "id": "premium",
                "name": "Premium",
                "description": "Accesso a tutte le funzionalità",
                "price": 19.99,
                "currency": "EUR",
                "interval": "month",
                "features": [
                    "Analisi del movimento avanzata",
                    "Dashboard completa",
                    "Piani di allenamento illimitati",
                    "Integrazione wearable",
                    "Supporto prioritario"
                ]
            },
            {
                "id": "annual",
                "name": "Annuale",
                "description": "Accesso premium con sconto annuale",
                "price": 199.99,
                "currency": "EUR",
                "interval": "year",
                "features": [
                    "Tutte le funzionalità premium",
                    "Risparmio del 17%",
                    "Accesso anticipato a nuove funzionalità"
                ]
            }
        ]
        
        return {
            "plans": plans
        }
    
    async def cancel_subscription(self, user_id: int, subscription_id: str) -> Dict[str, Any]:
        """
        Cancella un abbonamento attivo.
        
        Args:
            user_id: ID dell'utente
            subscription_id: ID dell'abbonamento
            
        Returns:
            Stato della cancellazione
        """
        # Verifica che l'abbonamento appartenga all'utente
        subscription = await database.fetch_one(
            """
            SELECT id, stripe_id FROM subscriptions
            WHERE id = :subscription_id AND user_id = :user_id
            """,
            {"subscription_id": subscription_id, "user_id": user_id}
        )
        
        if not subscription:
            raise ValueError("Abbonamento non trovato o non autorizzato")
        
        # In una implementazione reale, qui ci sarebbe la cancellazione su Stripe
        # Per questa implementazione, aggiorniamo solo il database
        
        # Aggiorna stato abbonamento
        await database.execute(
            """
            UPDATE subscriptions
            SET status = 'cancelled', end_date = :end_date
            WHERE id = :subscription_id
            """,
            {
                "subscription_id": subscription_id,
                "end_date": datetime.now()
            }
        )
        
        return {
            "status": "cancelled",
            "subscription_id": subscription_id
        }
    
    async def handle_payment_webhook(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Gestisce webhook per eventi di pagamento da Stripe.
        
        Args:
            event_data: Dati dell'evento
            
        Returns:
            Stato dell'elaborazione
        """
        # In una implementazione reale, qui ci sarebbe la gestione degli eventi Stripe
        # Per questa implementazione, simuliamo il processo
        
        event_type = event_data.get("type")
        
        if event_type == "invoice.payment_succeeded":
            # Aggiorna stato abbonamento
            stripe_id = event_data.get("data", {}).get("object", {}).get("subscription")
            if stripe_id:
                await database.execute(
                    """
                    UPDATE subscriptions
                    SET status = 'active'
                    WHERE stripe_id = :stripe_id
                    """,
                    {"stripe_id": stripe_id}
                )
        
        elif event_type == "invoice.payment_failed":
            # Aggiorna stato abbonamento
            stripe_id = event_data.get("data", {}).get("object", {}).get("subscription")
            if stripe_id:
                await database.execute(
                    """
                    UPDATE subscriptions
                    SET status = 'past_due'
                    WHERE stripe_id = :stripe_id
                    """,
                    {"stripe_id": stripe_id}
                )
        
        return {
            "status": "processed",
            "event_type": event_type
        }
    
    async def _get_plan_by_id(self, plan_id: str) -> Optional[Dict[str, Any]]:
        """
        Ottiene un piano di abbonamento per ID.
        
        Args:
            plan_id: ID del piano
            
        Returns:
            Dettagli del piano o None se non trovato
        """
        plans = (await self.get_subscription_plans())["plans"]
        for plan in plans:
            if plan["id"] == plan_id:
                return plan
        return None
