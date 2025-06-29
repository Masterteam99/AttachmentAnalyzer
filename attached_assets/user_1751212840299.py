from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    fitness_level: Optional[int] = 1
    goals: Optional[List[str]] = []

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    
    class Config:
        orm_mode = True

class UserInDB(User):
    hashed_password: str
