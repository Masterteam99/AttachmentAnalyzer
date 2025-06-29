from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from ...models.user import User, UserCreate, UserInDB
from ...config.settings import settings
from ...models.database import database

class AuthService:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
    
    def verify_password(self, plain_password, hashed_password):
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password):
        return self.pwd_context.hash(password)
    
    async def get_user(self, email: str):
        # Implementazione con database
        user = await database.fetch_one(
            "SELECT * FROM users WHERE email = :email", 
            {"email": email}
        )
        if user:
            return UserInDB(**user)
        return None
    
    async def authenticate_user(self, email: str, password: str):
        user = await self.get_user(email)
        if not user:
            return False
        if not self.verify_password(password, user.hashed_password):
            return False
        return user
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    
    async def get_current_user(self, token: str = Depends(oauth2_scheme)):
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenziali non valide",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            email: str = payload.get("sub")
            if email is None:
                raise credentials_exception
        except jwt.PyJWTError:
            raise credentials_exception
        user = await self.get_user(email=email)
        if user is None:
            raise credentials_exception
        return user
    
    async def create_user(self, user_create: UserCreate):
        # Verifica se l'utente esiste già
        existing_user = await self.get_user(user_create.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email già registrata"
            )
        
        # Crea nuovo utente
        hashed_password = self.get_password_hash(user_create.password)
        user_dict = user_create.dict()
        del user_dict["password"]
        user_dict["hashed_password"] = hashed_password
        
        # Salva nel database
        user_id = await database.execute(
            "INSERT INTO users (email, hashed_password, full_name, fitness_level) "
            "VALUES (:email, :hashed_password, :full_name, :fitness_level) RETURNING id",
            user_dict
        )
        
        return {**user_dict, "id": user_id}
