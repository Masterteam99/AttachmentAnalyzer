from databases import Database
from sqlalchemy import create_engine, MetaData
from ..config.settings import settings

# Crea connessione al database
database = Database(settings.DATABASE_URL)
metadata = MetaData()

# Funzione per inizializzare il database
async def init_db():
    # Crea le tabelle se non esistono
    engine = create_engine(settings.DATABASE_URL)
    from sqlalchemy import Table, Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
    from datetime import datetime
    
    # Definisci tabelle
    users = Table(
        "users",
        metadata,
        Column("id", Integer, primary_key=True),
        Column("email", String, unique=True, index=True),
        Column("hashed_password", String),
        Column("full_name", String, nullable=True),
        Column("fitness_level", Integer, default=1),
        Column("goals", String, nullable=True),
        Column("created_at", DateTime, default=datetime.now),
        Column("is_active", Boolean, default=True)
    )

    sessions = Table(
        "sessions",
        metadata,
        Column("id", String, primary_key=True),
        Column("user_id", Integer, ForeignKey("users.id")),
        Column("exercise_type", String),
        Column("start_time", DateTime),
        Column("end_time", DateTime, nullable=True),
        Column("frame_count", Integer, default=0),
        Column("accuracy", Float, nullable=True),
        Column("feedback", Text, nullable=True)
    )

    achievements = Table(
        "achievements",
        metadata,
        Column("id", Integer, primary_key=True),
        Column("user_id", Integer, ForeignKey("users.id")),
        Column("type", String),
        Column("title", String),
        Column("description", Text),
        Column("earned_at", DateTime, default=datetime.now)
    )

    workout_plans = Table(
        "workout_plans",
        metadata,
        Column("id", Integer, primary_key=True),
        Column("user_id", Integer, ForeignKey("users.id")),
        Column("name", String),
        Column("description", Text, nullable=True),
        Column("created_at", DateTime, default=datetime.now),
        Column("is_active", Boolean, default=True)
    )

    workout_exercises = Table(
        "workout_exercises",
        metadata,
        Column("id", Integer, primary_key=True),
        Column("plan_id", Integer, ForeignKey("workout_plans.id")),
        Column("name", String),
        Column("description", Text, nullable=True),
        Column("type", String),
        Column("difficulty", Integer),
        Column("target_muscles", String),
        Column("day", Integer),
        Column("order", Integer)
    )

    subscriptions = Table(
        "subscriptions",
        metadata,
        Column("id", Integer, primary_key=True),
        Column("user_id", Integer, ForeignKey("users.id")),
        Column("stripe_id", String, nullable=True),
        Column("plan", String),
        Column("status", String),
        Column("start_date", DateTime),
        Column("end_date", DateTime, nullable=True)
    )

    wearable_integrations = Table(
        "wearable_integrations",
        metadata,
        Column("id", Integer, primary_key=True),
        Column("user_id", Integer, ForeignKey("users.id")),
        Column("provider", String),
        Column("access_token", String),
        Column("refresh_token", String, nullable=True),
        Column("expires_at", DateTime, nullable=True),
        Column("created_at", DateTime, default=datetime.now),
        Column("last_sync", DateTime, nullable=True)
    )

    health_data = Table(
        "health_data",
        metadata,
        Column("id", Integer, primary_key=True),
        Column("user_id", Integer, ForeignKey("users.id")),
        Column("data_type", String),
        Column("value", Float),
        Column("source", String),
        Column("timestamp", DateTime)
    )
    
    # Crea tabelle
    metadata.create_all(engine)
