from sqlalchemy import create_engine, Column, String, DateTime, Float, Text, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import uuid

from api.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Agent(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True, index=True)
    agent_id = Column(String, unique=True, index=True, nullable=False)
    wallet_address = Column(String, unique=True, index=True)
    usdc_balance = Column(Float, default=0.0)
    owner_telegram_id = Column(String, index=True)
    owner_email = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_verified = Column(Boolean, default=False)


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String, primary_key=True, index=True)
    ticket_id = Column(String, unique=True, index=True, nullable=False)
    agent_id = Column(String, index=True, nullable=False)
    stream_url = Column(String, nullable=False)
    stream_title = Column(String)
    payment_id = Column(String)
    payment_amount_usdc = Column(Float)
    payment_status = Column(String, default="pending")  # pending, paid, failed
    status = Column(String, default="active")  # active, expired, completed
    purchased_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)


class Digest(Base):
    __tablename__ = "digests"

    id = Column(String, primary_key=True, index=True)
    digest_id = Column(String, unique=True, index=True, nullable=False)
    ticket_id = Column(String, index=True, nullable=False)
    agent_id = Column(String, index=True, nullable=False)
    summary = Column(Text)
    key_insights = Column(JSON)
    sentiment = Column(String)
    duration_minutes = Column(Float)
    trio_cost_usdc = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    sent_to_owner = Column(Boolean, default=False)
    sent_at = Column(DateTime)


class Stream(Base):
    __tablename__ = "streams"

    id = Column(String, primary_key=True, index=True)
    stream_id = Column(String, unique=True, index=True, nullable=False)
    stream_url = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    owner_id = Column(String, index=True)
    ticket_price_usdc = Column(Float, default=0.10)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
