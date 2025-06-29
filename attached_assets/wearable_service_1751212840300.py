import requests
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from ..models.database import database
from ..config.settings import settings

class WearableService:
    def __init__(self):
        self.fitbit_api_url = "https://api.fitbit.com"
    
    async def get_user_integrations(self, user_id: int) -> Dict[str, Any]:
        """
        Ottiene le integrazioni wearable dell'utente.
        
        Args:
            user_id: ID dell'utente
            
        Returns:
            Dizionario con le integrazioni attive
        """
        integrations = await database.fetch_all(
            """
            SELECT provider, access_token, refresh_token, expires_at, last_sync
            FROM wearable_integrations
            WHERE user_id = :user_id
            """,
            {"user_id": user_id}
        )
        
        result = {
            "integrations": []
        }
        
        for integration in integrations:
            result["integrations"].append({
                "provider": integration["provider"],
                "connected": True,
                "expires_at": integration["expires_at"].isoformat() if integration["expires_at"] else None,
                "last_sync": integration["last_sync"].isoformat() if integration["last_sync"] else None
            })
        
        return result
    
    async def connect_fitbit(self, user_id: int, auth_data: Dict[str, str]) -> Dict[str, Any]:
        """
        Connette l'account Fitbit dell'utente.
        
        Args:
            user_id: ID dell'utente
            auth_data: Dati di autenticazione Fitbit
            
        Returns:
            Stato della connessione
        """
        # In una implementazione reale, qui ci sarebbe lo scambio del codice di autorizzazione
        # con Fitbit per ottenere i token di accesso e refresh
        
        # Per questa implementazione, simuliamo il processo
        if "code" not in auth_data:
            raise ValueError("Codice di autorizzazione mancante")
        
        # Simula token di accesso e refresh
        access_token = f"simulated_access_token_{user_id}"
        refresh_token = f"simulated_refresh_token_{user_id}"
        expires_at = datetime.now() + timedelta(days=30)
        
        # Controlla se esiste già un'integrazione
        existing = await database.fetch_one(
            """
            SELECT id FROM wearable_integrations
            WHERE user_id = :user_id AND provider = 'fitbit'
            """,
            {"user_id": user_id}
        )
        
        if existing:
            # Aggiorna integrazione esistente
            await database.execute(
                """
                UPDATE wearable_integrations
                SET access_token = :access_token, refresh_token = :refresh_token, expires_at = :expires_at
                WHERE user_id = :user_id AND provider = 'fitbit'
                """,
                {
                    "user_id": user_id,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "expires_at": expires_at
                }
            )
        else:
            # Crea nuova integrazione
            await database.execute(
                """
                INSERT INTO wearable_integrations
                (user_id, provider, access_token, refresh_token, expires_at, created_at)
                VALUES (:user_id, 'fitbit', :access_token, :refresh_token, :expires_at, :created_at)
                """,
                {
                    "user_id": user_id,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "expires_at": expires_at,
                    "created_at": datetime.now()
                }
            )
        
        # Sincronizza dati immediatamente
        await self.sync_health_data(user_id)
        
        return {
            "status": "connected",
            "provider": "fitbit",
            "expires_at": expires_at.isoformat()
        }
    
    async def sync_health_data(self, user_id: int) -> Dict[str, Any]:
        """
        Sincronizza i dati dai dispositivi wearable.
        
        Args:
            user_id: ID dell'utente
            
        Returns:
            Risultato della sincronizzazione
        """
        # Ottieni integrazioni attive
        integrations = await database.fetch_all(
            """
            SELECT provider, access_token, refresh_token
            FROM wearable_integrations
            WHERE user_id = :user_id
            """,
            {"user_id": user_id}
        )
        
        synced_data = []
        
        for integration in integrations:
            provider = integration["provider"]
            access_token = integration["access_token"]
            
            if provider == "fitbit":
                # In una implementazione reale, qui ci sarebbe la chiamata all'API Fitbit
                # Per questa implementazione, simuliamo i dati
                
                # Simula dati di frequenza cardiaca
                heart_rate_data = {
                    "data_type": "heart_rate",
                    "value": 72.5,  # BPM medio
                    "source": "fitbit",
                    "timestamp": datetime.now()
                }
                
                # Simula dati di passi
                steps_data = {
                    "data_type": "steps",
                    "value": 8500,  # Passi giornalieri
                    "source": "fitbit",
                    "timestamp": datetime.now()
                }
                
                # Simula dati di sonno
                sleep_data = {
                    "data_type": "sleep",
                    "value": 7.5,  # Ore di sonno
                    "source": "fitbit",
                    "timestamp": datetime.now()
                }
                
                # Salva dati nel database
                for data in [heart_rate_data, steps_data, sleep_data]:
                    await database.execute(
                        """
                        INSERT INTO health_data
                        (user_id, data_type, value, source, timestamp)
                        VALUES (:user_id, :data_type, :value, :source, :timestamp)
                        """,
                        {
                            "user_id": user_id,
                            **data
                        }
                    )
                    
                    synced_data.append(data)
                
                # Aggiorna timestamp ultima sincronizzazione
                await database.execute(
                    """
                    UPDATE wearable_integrations
                    SET last_sync = :last_sync
                    WHERE user_id = :user_id AND provider = :provider
                    """,
                    {
                        "user_id": user_id,
                        "provider": provider,
                        "last_sync": datetime.now()
                    }
                )
        
        return {
            "status": "synced",
            "count": len(synced_data),
            "data": synced_data
        }
    
    async def get_health_data(self, user_id: int) -> Dict[str, Any]:
        """
        Ottiene i dati di salute sincronizzati dai dispositivi wearable.
        
        Args:
            user_id: ID dell'utente
            
        Returns:
            Dati di salute
        """
        # Ottieni dati recenti
        recent_data = await database.fetch_all(
            """
            SELECT data_type, value, source, timestamp
            FROM health_data
            WHERE user_id = :user_id
            ORDER BY timestamp DESC
            LIMIT 100
            """,
            {"user_id": user_id}
        )
        
        # Organizza dati per tipo
        data_by_type = {}
        for data in recent_data:
            data_type = data["data_type"]
            if data_type not in data_by_type:
                data_by_type[data_type] = []
            
            data_by_type[data_type].append({
                "value": data["value"],
                "source": data["source"],
                "timestamp": data["timestamp"].isoformat()
            })
        
        # Calcola medie
        averages = {}
        for data_type, values in data_by_type.items():
            if values:
                avg_value = sum(item["value"] for item in values) / len(values)
                averages[data_type] = round(avg_value, 2)
        
        return {
            "data": data_by_type,
            "averages": averages
        }
    
    async def disconnect_provider(self, user_id: int, provider: str) -> Dict[str, Any]:
        """
        Disconnette un'integrazione wearable.
        
        Args:
            user_id: ID dell'utente
            provider: Provider da disconnettere
            
        Returns:
            Stato della disconnessione
        """
        # Verifica che l'integrazione esista
        integration = await database.fetch_one(
            """
            SELECT id FROM wearable_integrations
            WHERE user_id = :user_id AND provider = :provider
            """,
            {"user_id": user_id, "provider": provider}
        )
        
        if not integration:
            raise ValueError(f"Integrazione {provider} non trovata")
        
        # Elimina integrazione
        await database.execute(
            """
            DELETE FROM wearable_integrations
            WHERE user_id = :user_id AND provider = :provider
            """,
            {"user_id": user_id, "provider": provider}
        )
        
        return {
            "status": "disconnected",
            "provider": provider
        }
