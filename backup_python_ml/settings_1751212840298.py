import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    # Server
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 8000
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./fitness.db"
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    
    # JWT
    SECRET_KEY: str = "your-256-bit-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 ore
    
    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4"
    
    # Stripe
    STRIPE_API_KEY: str = ""
    
    # Fitbit
    FITBIT_CLIENT_ID: str = ""
    FITBIT_CLIENT_SECRET: str = ""
    
    # Paths
    DATA_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
    UPLOADS_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    LOGS_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
    
    class Config:
        env_file = ".env"

settings = Settings()
