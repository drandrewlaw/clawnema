from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any
from datetime import datetime


# Agent
class AgentCreate(BaseModel):
    agent_id: str
    wallet_address: Optional[str] = None
    owner_telegram_id: Optional[str] = None
    owner_email: Optional[str] = None


class AgentResponse(BaseModel):
    id: str
    agent_id: str
    wallet_address: Optional[str]
    usdc_balance: float
    owner_telegram_id: Optional[str]
    owner_email: Optional[str]
    created_at: datetime
    is_verified: bool

    class Config:
        from_attributes = True


# Ticket
class TicketPurchaseRequest(BaseModel):
    agent_id: str
    stream_url: HttpUrl
    payment_method: str = "x402"


class TicketResponse(BaseModel):
    id: str
    ticket_id: str
    agent_id: str
    stream_url: str
    stream_title: Optional[str]
    payment_id: Optional[str]
    payment_amount_usdc: float
    payment_status: str
    status: str
    purchased_at: datetime
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True


# Digest
class DigestCreate(BaseModel):
    ticket_id: str
    summary: str
    key_insights: List[str]
    sentiment: str
    duration_minutes: float
    trio_cost_usdc: float


class DigestResponse(BaseModel):
    id: str
    digest_id: str
    ticket_id: str
    agent_id: str
    summary: str
    key_insights: List[str]
    sentiment: str
    duration_minutes: float
    trio_cost_usdc: float
    created_at: datetime
    sent_to_owner: bool
    sent_at: Optional[datetime]

    class Config:
        from_attributes = True


# Stream
class StreamCreate(BaseModel):
    stream_url: HttpUrl
    title: str
    description: Optional[str] = None
    ticket_price_usdc: float = 0.10


class StreamResponse(BaseModel):
    id: str
    stream_id: str
    stream_url: str
    title: str
    description: Optional[str]
    owner_id: Optional[str]
    ticket_price_usdc: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Trio API
class TrioAnalysisRequest(BaseModel):
    image_url: Optional[HttpUrl] = None
    audio_url: Optional[HttpUrl] = None
    text: Optional[str] = None
    analysis_type: List[str] = ["visual", "audio", "text"]


class TrioAnalysisResponse(BaseModel):
    visual: Optional[Dict[str, Any]] = None
    audio: Optional[Dict[str, Any]] = None
    text: Optional[Dict[str, Any]] = None
    sentiment: Optional[str] = None
    cost_usdc: float
