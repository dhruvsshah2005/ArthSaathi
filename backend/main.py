import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from sqlalchemy import text
from database import engine, Base
from routers import auth, chat, transactions

os.makedirs("uploads/images", exist_ok=True)

# Run automatic schema migration for PostgreSQL
try:
    # Auto create tables including the new transactions table
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE parametric_profiles ADD COLUMN IF NOT EXISTS is_blind BOOLEAN DEFAULT FALSE;"))
        conn.commit()
    print("✅ PostgreSQL Schema Migration: Tables created & 'is_blind' column verified/added")
except Exception as e:
    print(f"⚠️ PostgreSQL Schema Migration Failed: {e}")

app = FastAPI(title="ArthaSaathi API")

# Include Modular Routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(transactions.router)
