from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import Optional

class AchievementType(str, Enum):
    STREAK = "streak"
    PERFECTIONIST = "perfectionist"
    EXPLORER = "explorer"

class AchievementBase(BaseModel):
    type: AchievementType
    title: str
    description: str

class AchievementCreate(AchievementBase):
    user_id: int

class Achievement(AchievementBase):
    id: int
    user_id: int
    earned_at: datetime
    
    class Config:
        orm_mode = True
