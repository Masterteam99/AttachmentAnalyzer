import json
import os
from datetime import datetime
from typing import Dict, Any, List
from ..models.database import database
from ..config.settings import settings

class GDPRService:
    async def get_user_data(self, user_id: int) -> Dict[str, Any]:
        """
        Ottiene tutti i dati personali dell'utente.
        
        Args:
            user_id: ID dell'utente
            
        Returns:
            Dizionario con tutti i dati personali
        """
        # Ottieni dati utente
        user = await database.fetch_one(
            "SELECT * FROM users WHERE id = :user_id",
            {"user_id": user_id}
        )
        
        if not user:
            raise ValueError("Utente non trovato")
        
        # Ottieni sessioni
        sessions = await database.fetch_all(
            "SELECT * FROM sessions WHERE user_id = :user_id",
            {"user_id": user_id}
        )
        
        # Ottieni achievement
        achievements = await database.fetch_all(
            "SELECT * FROM achievements WHERE user_id = :user_id",
            {"user_id": user_id}
        )
        
        # Ottieni piani di allenamento
        workout_plans = await database.fetch_all(
            "SELECT * FROM workout_plans WHERE user_id = :user_id",
            {"user_id": user_id}
        )
        
        # Ottieni abbonamenti
        subscriptions = await database.fetch_all(
            "SELECT * FROM subscriptions WHERE user_id = :user_id",
            {"user_id": user_id}
        )
        
        # Ottieni integrazioni wearable
        wearable_integrations = await database.fetch_all(
            "SELECT * FROM wearable_integrations WHERE user_id = :user_id",
            {"user_id": user_id}
        )
        
        # Ottieni dati salute
        health_data = await database.fetch_all(
            "SELECT * FROM health_data WHERE user_id = :user_id",
            {"user_id": user_id}
        )
        
        # Ottieni consensi
        consents = await self.get_user_consent(user_id)
        
        # Formatta risultato
        result = {
            "user": dict(user),
            "sessions": [dict(session) for session in sessions],
            "achievements": [dict(achievement) for achievement in achievements],
            "workout_plans": [dict(plan) for plan in workout_plans],
            "subscriptions": [dict(sub) for sub in subscriptions],
            "wearable_integrations": [dict(integration) for integration in wearable_integrations],
            "health_data": [dict(data) for data in health_data],
            "consents": consents
        }
        
        # Rimuovi password hash per sicurezza
        if "hashed_password" in result["user"]:
            del result["user"]["hashed_password"]
        
        return result
    
    async def export_user_data(self, user_id: int) -> Dict[str, Any]:
        """
        Esporta tutti i dati personali dell'utente in formato JSON.
        
        Args:
            user_id: ID dell'utente
            
        Returns:
            Percorso del file esportato
        """
        # Ottieni tutti i dati
        user_data = await self.get_user_data(user_id)
        
        # Crea directory se non esiste
        export_dir = os.path.join(settings.DATA_DIR, str(user_id), "exports")
        os.makedirs(export_dir, exist_ok=True)
        
        # Crea nome file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.join(export_dir, f"user_data_export_{timestamp}.json")
        
        # Converti date in stringhe per JSON
        user_data = self._convert_dates_to_str(user_data)
        
        # Salva file
        with open(filename, "w") as f:
            json.dump(user_data, f, indent=2)
        
        return {
            "status": "exported",
            "file_path": filename
        }
    
    async def delete_user_data(self, user_id: int) -> Dict[str, Any]:
        """
        Elimina tutti i dati personali dell'utente (diritto all'oblio).
        
        Args:
            user_id: ID dell'utente
            
        Returns:
            Stato dell'eliminazione
        """
        # Elimina dati salute
        await database.execute(
            "DELETE FROM health_data WHERE user_id = :user_id",
            {"user_id": user_id}
        )
        
        # Elimina integrazioni wearable
        await database.execute(
            "DELETE FROM wearable_integrations WHERE user_id = :user_id",
            {"user_id": user_id}
        )
        
        # Elimina abbonamenti
        await database.execute(
            "DELETE FROM subscriptions WHERE user_id = :user_id",
            {"user_id": user_id}
        )
        
        # Elimina esercizi dei piani
        plan_ids = await database.fetch_all(
            "SELECT id FROM workout_plans WHERE user_id = :user_id",
            {"user_id": user_id}
        )
        
        for plan in plan_ids:
            await database.execute(
                "DELETE FROM workout_exercises WHERE plan_id = :plan_id",
                {"plan_id": plan["id"]}
            )
        
        # Elimina piani
        await database.execute(
            "DELETE FROM workout_plans WHERE user_id = :user_id",
            {"user_id": user_id}
        )
        
        # Elimina achievement
        await database.execute(
            "DELETE FROM achievements WHERE user_id = :user_id",
            {"user_id": user_id}
        )
        
        # Elimina sessioni
        await database.execute(
            "DELETE FROM sessions WHERE user_id = :user_id",
            {"user_id": user_id}
        )
        
        # Anonimizza utente invece di eliminarlo
        await database.execute(
            """
            UPDATE users
            SET email = :anonymous_email,
                hashed_password = :anonymous_password,
                full_name = 'Utente Cancellato',
                is_active = FALSE
            WHERE id = :user_id
            """,
            {
                "user_id": user_id,
                "anonymous_email": f"deleted_{user_id}@example.com",
                "anonymous_password": "deleted"
            }
        )
        
        return {
            "status": "deleted",
            "user_id": user_id
        }
    
    async def update_user_consent(self, user_id: int, consent_data: Dict[str, bool]) -> Dict[str, Any]:
        """
        Aggiorna i consensi dell'utente.
        
        Args:
            user_id: ID dell'utente
            consent_data: Dati dei consensi
            
        Returns:
            Consensi aggiornati
        """
        # Verifica che l'utente esista
        user = await database.fetch_one(
            "SELECT id FROM users WHERE id = :user_id",
            {"user_id": user_id}
        )
        
        if not user:
            raise ValueError("Utente non trovato")
        
        # Aggiorna consensi
        for consent_type, value in consent_data.items():
            # Verifica se il consenso esiste già
            existing = await database.fetch_one(
                """
                SELECT id FROM user_consents
                WHERE user_id = :user_id AND consent_type = :consent_type
                """,
                {"user_id": user_id, "consent_type": consent_type}
            )
            
            if existing:
                # Aggiorna consenso esistente
                await database.execute(
                    """
                    UPDATE user_consents
                    SET value = :value, updated_at = :updated_at
                    WHERE user_id = :user_id AND consent_type = :consent_type
                    """,
                    {
                        "user_id": user_id,
                        "consent_type": consent_type,
                        "value": value,
                        "updated_at": datetime.now()
                    }
                )
            else:
                # Crea nuovo consenso
                await database.execute(
                    """
                    INSERT INTO user_consents (user_id, consent_type, value, created_at, updated_at)
                    VALUES (:user_id, :consent_type, :value, :created_at, :updated_at)
                    """,
                    {
                        "user_id": user_id,
                        "consent_type": consent_type,
                        "value": value,
                        "created_at": datetime.now(),
                        "updated_at": datetime.now()
                    }
                )
        
        # Restituisci consensi aggiornati
        return await self.get_user_consent(user_id)
    
    async def get_user_consent(self, user_id: int) -> Dict[str, Any]:
        """
        Ottiene i consensi attuali dell'utente.
        
        Args:
            user_id: ID dell'utente
            
        Returns:
            Consensi attuali
        """
        # Verifica che l'utente esista
        user = await database.fetch_one(
            "SELECT id FROM users WHERE id = :user_id",
            {"user_id": user_id}
        )
        
        if not user:
            raise ValueError("Utente non trovato")
        
        # Ottieni consensi
        consents = await database.fetch_all(
            """
            SELECT consent_type, value, created_at, updated_at
            FROM user_consents
            WHERE user_id = :user_id
            """,
            {"user_id": user_id}
        )
        
        # Formatta risultato
        result = {
            "consents": {}
        }
        
        for consent in consents:
            result["consents"][consent["consent_type"]] = {
                "value": consent["value"],
                "created_at": consent["created_at"].isoformat(),
                "updated_at": consent["updated_at"].isoformat()
            }
        
        # Aggiungi consensi predefiniti se mancanti
        default_consents = {
            "marketing": False,
            "analytics": False,
            "third_party": False,
            "health_data": False
        }
        
        for consent_type, default_value in default_consents.items():
            if consent_type not in result["consents"]:
                result["consents"][consent_type] = {
                    "value": default_value,
                    "created_at": None,
                    "updated_at": None
                }
        
        return result
    
    def _convert_dates_to_str(self, data: Any) -> Any:
        """
        Converte ricorsivamente tutte le date in stringhe ISO.
        
        Args:
            data: Dati da convertire
            
        Returns:
            Dati con date convertite
        """
        if isinstance(data, datetime):
            return data.isoformat()
        elif isinstance(data, dict):
            return {k: self._convert_dates_to_str(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._convert_dates_to_str(item) for item in data]
        else:
            return data
