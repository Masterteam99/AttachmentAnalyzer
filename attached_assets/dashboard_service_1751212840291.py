from datetime import datetime, timedelta
from typing import List, Dict, Any
from ..models.database import database
from ..config.settings import settings

class DashboardService:
    async def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        """
        Ottiene le statistiche principali per la dashboard dell'utente.
        
        Args:
            user_id: ID dell'utente
            
        Returns:
            Dizionario con le statistiche
        """
        # Calcola sessioni settimanali
        weekly_sessions = await database.fetch_val(
            """
            SELECT COUNT(*) FROM sessions 
            WHERE user_id = :user_id AND start_time >= :week_ago
            """,
            {
                "user_id": user_id,
                "week_ago": datetime.now() - timedelta(days=7)
            }
        ) or 0
        
        # Calcola precisione media
        average_accuracy = await database.fetch_val(
            """
            SELECT AVG(accuracy) FROM sessions 
            WHERE user_id = :user_id AND accuracy IS NOT NULL
            """,
            {"user_id": user_id}
        ) or 0
        
        # Calcola calorie bruciate totali
        total_calories = await database.fetch_val(
            """
            SELECT SUM(calories_burned) FROM sessions 
            WHERE user_id = :user_id AND calories_burned IS NOT NULL
            """,
            {"user_id": user_id}
        ) or 0
        
        # Ottieni livello fitness
        fitness_level = await database.fetch_val(
            """
            SELECT fitness_level FROM users 
            WHERE id = :user_id
            """,
            {"user_id": user_id}
        ) or 1
        
        return {
            "weekly_sessions": weekly_sessions,
            "average_accuracy": round(average_accuracy, 1),
            "total_calories": round(total_calories, 1),
            "fitness_level": fitness_level
        }
    
    async def get_performance_data(self, user_id: int) -> List[Dict[str, Any]]:
        """
        Ottiene i dati di performance per i grafici della dashboard.
        
        Args:
            user_id: ID dell'utente
            
        Returns:
            Lista di dati per i grafici
        """
        # Ottieni dati delle ultime 10 sessioni
        sessions = await database.fetch_all(
            """
            SELECT start_time, accuracy, exercise_type 
            FROM sessions 
            WHERE user_id = :user_id AND accuracy IS NOT NULL
            ORDER BY start_time DESC
            LIMIT 10
            """,
            {"user_id": user_id}
        )
        
        # Formatta i dati per il grafico
        performance_data = []
        for session in sessions:
            performance_data.append({
                "date": session["start_time"].strftime("%d/%m"),
                "accuracy": session["accuracy"],
                "exercise": session["exercise_type"]
            })
        
        # Inverti l'ordine per avere i dati in ordine cronologico
        performance_data.reverse()
        
        return performance_data
    
    async def get_recent_sessions(self, user_id: int) -> List[Dict[str, Any]]:
        """
        Ottiene le sessioni di allenamento recenti dell'utente.
        
        Args:
            user_id: ID dell'utente
            
        Returns:
            Lista di sessioni recenti
        """
        # Ottieni le ultime 5 sessioni
        sessions = await database.fetch_all(
            """
            SELECT id, exercise_type, start_time, end_time, accuracy, feedback 
            FROM sessions 
            WHERE user_id = :user_id
            ORDER BY start_time DESC
            LIMIT 5
            """,
            {"user_id": user_id}
        )
        
        # Formatta i dati
        recent_sessions = []
        for session in sessions:
            # Calcola durata
            duration = None
            if session["end_time"] and session["start_time"]:
                duration = (session["end_time"] - session["start_time"]).total_seconds() / 60
            
            recent_sessions.append({
                "id": session["id"],
                "exercise_type": session["exercise_type"],
                "date": session["start_time"].strftime("%d/%m/%Y"),
                "time": session["start_time"].strftime("%H:%M"),
                "duration": round(duration, 1) if duration else None,
                "accuracy": session["accuracy"],
                "feedback": session["feedback"]
            })
        
        return recent_sessions
    
    async def get_goal_progress(self, user_id: int, goal_id: int) -> Dict[str, Any]:
        """
        Ottiene il progresso verso un obiettivo specifico.
        
        Args:
            user_id: ID dell'utente
            goal_id: ID dell'obiettivo
            
        Returns:
            Dizionario con i dati di progresso
        """
        # In una versione completa, qui ci sarebbe la logica per recuperare
        # e calcolare il progresso verso obiettivi specifici
        
        # Per ora restituiamo dati di esempio
        return {
            "goal_id": goal_id,
            "name": "Esempio Obiettivo",
            "target": 10,
            "current": 7,
            "progress_percentage": 70,
            "remaining_days": 5
        }
