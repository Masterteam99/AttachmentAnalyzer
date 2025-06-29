from datetime import datetime, timedelta
import redis
from typing import List
from ..models.achievement import Achievement, AchievementType
from ..config.settings import settings
from ..models.database import database

class GamificationService:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=0
        )
    
    async def get_user_achievements(self, user_id: int) -> List[Achievement]:
        # Implementazione con database
        achievements = await database.fetch_all(
            "SELECT * FROM achievements WHERE user_id = :user_id",
            {"user_id": user_id}
        )
        return [Achievement(**achievement) for achievement in achievements]
    
    async def get_user_streak(self, user_id: int) -> dict:
        streak_key = f"user:{user_id}:streak"
        current_streak = self.redis_client.get(streak_key)
        
        if current_streak is None:
            current_streak = 0
        else:
            current_streak = int(current_streak)
        
        last_activity_key = f"user:{user_id}:last_activity"
        last_activity = self.redis_client.get(last_activity_key)
        
        if last_activity:
            last_activity = datetime.fromtimestamp(float(last_activity))
        else:
            last_activity = None
        
        return {
            "current_streak": current_streak,
            "last_activity": last_activity
        }
    
    async def update_streak(self, user_id: int) -> int:
        streak_key = f"user:{user_id}:streak"
        last_activity_key = f"user:{user_id}:last_activity"
        
        # Ottieni l'ultima attività
        last_activity = self.redis_client.get(last_activity_key)
        current_time = datetime.now()
        
        if last_activity:
            last_activity = datetime.fromtimestamp(float(last_activity))
            # Controlla se è un nuovo giorno ma non più di un giorno di differenza
            if (current_time.date() > last_activity.date() and 
                current_time - last_activity < timedelta(days=2)):
                # Incrementa streak
                current_streak = self.redis_client.incr(streak_key)
            elif current_time.date() > last_activity.date() + timedelta(days=1):
                # Reset streak se più di un giorno di differenza
                current_streak = 1
                self.redis_client.set(streak_key, current_streak)
            else:
                # Stesso giorno, mantieni streak
                current_streak = int(self.redis_client.get(streak_key) or 0)
        else:
            # Prima attività
            current_streak = 1
            self.redis_client.set(streak_key, current_streak)
        
        # Aggiorna timestamp ultima attività
        self.redis_client.set(last_activity_key, current_time.timestamp())
        
        return current_streak
    
    async def check_session_achievements(self, user_id: int, session_id: str) -> List[Achievement]:
        # Aggiorna streak
        current_streak = await self.update_streak(user_id)
        
        # Ottieni dati sessione
        session = await database.fetch_one(
            "SELECT * FROM sessions WHERE id = :session_id",
            {"session_id": session_id}
        )
        
        new_achievements = []
        
        # Controlla achievement streak
        if current_streak >= 7 and not await self._has_achievement(user_id, AchievementType.STREAK):
            streak_achievement = await self._grant_achievement(
                user_id, 
                AchievementType.STREAK,
                "Streak di 7 giorni",
                "Hai completato allenamenti per 7 giorni consecutivi!"
            )
            new_achievements.append(streak_achievement)
        
        # Controlla achievement perfezionista
        if session and session["accuracy"] >= 95:
            perfectionist_achievement = await self._grant_achievement(
                user_id,
                AchievementType.PERFECTIONIST,
                "Perfezionista",
                "Hai completato un esercizio con precisione superiore al 95%!"
            )
            new_achievements.append(perfectionist_achievement)
        
        return new_achievements
    
    async def _has_achievement(self, user_id: int, achievement_type: AchievementType) -> bool:
        achievement = await database.fetch_one(
            "SELECT * FROM achievements WHERE user_id = :user_id AND type = :type",
            {"user_id": user_id, "type": achievement_type.value}
        )
        return achievement is not None
    
    async def _grant_achievement(
        self, 
        user_id: int, 
        achievement_type: AchievementType,
        title: str,
        description: str
    ) -> Achievement:
        achievement_id = await database.execute(
            """
            INSERT INTO achievements (user_id, type, title, description, earned_at)
            VALUES (:user_id, :type, :title, :description, :earned_at)
            RETURNING id
            """,
            {
                "user_id": user_id,
                "type": achievement_type.value,
                "title": title,
                "description": description,
                "earned_at": datetime.now()
            }
        )
        
        return Achievement(
            id=achievement_id,
            user_id=user_id,
            type=achievement_type,
            title=title,
            description=description,
            earned_at=datetime.now()
        )
