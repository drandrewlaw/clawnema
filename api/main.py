from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import datetime, timedelta

from api.config import settings
from models.database import (
    Base, engine, SessionLocal, Agent, Ticket, Digest, Stream
)
from models.schemas import (
    AgentCreate, AgentResponse,
    TicketPurchaseRequest, TicketResponse,
    DigestCreate, DigestResponse,
    StreamCreate, StreamResponse,
    TrioAnalysisResponse
)
from services.trio_service import trio_service
from services.payment_service import x402_service
from services.notification_service import notification_service

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Clawnema API",
    description="Agent-Only Cinema Experience Platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==================== AGENT ENDPOINTS ====================

@app.post("/agents", response_model=AgentResponse)
async def create_agent(agent_data: AgentCreate, db: Session = next(get_db())):
    """Register a new agent"""

    # Check if agent already exists
    existing = db.query(Agent).filter(Agent.agent_id == agent_data.agent_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Agent already registered")

    # Create agentic wallet if not provided
    if not agent_data.wallet_address:
        wallet_response = await x402_service.create_agentic_wallet(agent_data.agent_id)
        wallet_address = wallet_response.get("wallet_address")
    else:
        wallet_address = agent_data.wallet_address

    # Get USDC balance
    balance = await x402_service.get_wallet_balance(wallet_address)

    agent = Agent(
        id=str(uuid.uuid4()),
        agent_id=agent_data.agent_id,
        wallet_address=wallet_address,
        usdc_balance=balance,
        owner_telegram_id=agent_data.owner_telegram_id,
        owner_email=agent_data.owner_email,
        is_verified=False
    )

    db.add(agent)
    db.commit()
    db.refresh(agent)

    return agent


@app.get("/agents/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str, db: Session = next(get_db())):
    """Get agent information"""

    agent = db.query(Agent).filter(Agent.agent_id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Refresh balance
    agent.usdc_balance = await x402_service.get_wallet_balance(agent.wallet_address)
    db.commit()

    return agent


# ==================== STREAM ENDPOINTS ====================

@app.get("/streams", response_model=List[StreamResponse])
async def list_streams(db: Session = next(get_db())):
    """List all available streams"""

    streams = db.query(Stream).filter(Stream.is_active == True).all()
    return streams


@app.post("/streams", response_model=StreamResponse)
async def create_stream(stream_data: StreamCreate, db: Session = next(get_db())):
    """Create a new stream (stream owners only)"""

    stream = Stream(
        id=str(uuid.uuid4()),
        stream_id=f"stream_{uuid.uuid4().hex[:12]}",
        stream_url=str(stream_data.stream_url),
        title=stream_data.title,
        description=stream_data.description,
        ticket_price_usdc=stream_data.ticket_price_usdc
    )

    db.add(stream)
    db.commit()
    db.refresh(stream)

    return stream


# ==================== TICKET ENDPOINTS ====================

@app.post("/tickets/purchase", response_model=TicketResponse)
async def purchase_ticket(
    ticket_request: TicketPurchaseRequest,
    db: Session = next(get_db())
):
    """Purchase a ticket using x402 payment"""

    # Verify agent exists
    agent = db.query(Agent).filter(Agent.agent_id == ticket_request.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Find stream
    stream = db.query(Stream).filter(
        Stream.stream_url == str(ticket_request.stream_url)
    ).first()

    if not stream:
        # Create stream if not exists
        stream = Stream(
            id=str(uuid.uuid4()),
            stream_id=f"stream_{uuid.uuid4().hex[:12]}",
            stream_url=str(ticket_request.stream_url),
            title="Unknown Stream",
            ticket_price_usdc=0.10
        )
        db.add(stream)
        db.commit()

    # Create x402 payment request
    payment_id = x402_service.generate_payment_id()
    payment_request = await x402_service.create_payment_request(
        amount_usdc=stream.ticket_price_usdc,
        agent_wallet=agent.wallet_address,
        resource_id=payment_id
    )

    # Return HTTP 402 Payment Required
    return JSONResponse(
        status_code=status.HTTP_402_PAYMENT_REQUIRED,
        content={
            "payment_id": payment_id,
            "amount_usdc": stream.ticket_price_usdc,
            "currency": "USDC",
            "network": settings.x402_network,
            "payment_request": payment_request,
            "message": "Please complete x402 payment to purchase ticket"
        }
    )


@app.get("/tickets/{ticket_id}", response_model=TicketResponse)
async def get_ticket(ticket_id: str, db: Session = next(get_db())):
    """Get ticket information"""

    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    return ticket


# ==================== STREAM WATCHING ====================

@app.websocket("/tickets/{ticket_id}/watch")
async def watch_stream(websocket: WebSocket, ticket_id: str):
    """WebSocket for live stream monitoring"""

    await websocket.accept()

    try:
        db = SessionLocal()
        ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()

        if not ticket:
            await websocket.close(code=1008, reason="Ticket not found")
            return

        if ticket.status != "active":
            await websocket.close(code=1008, reason="Ticket not active")
            return

        await websocket.send_json({
            "type": "connected",
            "message": "Watching stream",
            "stream_url": ticket.stream_url
        })

        # Simulate stream monitoring
        frames_processed = 0
        total_cost = 0.0

        while True:
            # Wait for WebSocket message (would receive frames in production)
            data = await websocket.receive_json()

            if data.get("type") == "frame":
                # Process frame with Trio API (mock for now)
                frames_processed += 1

                # Cost per frame
                frame_cost = 0.001
                total_cost += frame_cost

                await websocket.send_json({
                    "type": "frame_processed",
                    "frame_number": frames_processed,
                    "cost_usdc": frame_cost,
                    "total_cost_usdc": total_cost
                })

            elif data.get("type") == "end_stream":
                # Generate digest
                await websocket.send_json({
                    "type": "stream_ended",
                    "frames_processed": frames_processed,
                    "total_cost_usdc": total_cost
                })
                break

    except WebSocketDisconnect:
        pass
    finally:
        db.close()


# ==================== DIGEST ENDPOINTS ====================

@app.post("/digests/create", response_model=DigestResponse)
async def create_digest(digest_data: DigestCreate, db: Session = next(get_db())):
    """Create and send digest to owner"""

    # Verify ticket
    ticket = db.query(Ticket).filter(Ticket.ticket_id == digest_data.ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Get agent
    agent = db.query(Agent).filter(Agent.agent_id == ticket.agent_id).first()

    # Create digest
    digest = Digest(
        id=str(uuid.uuid4()),
        digest_id=f"digest_{uuid.uuid4().hex[:12]}",
        ticket_id=digest_data.ticket_id,
        agent_id=ticket.agent_id,
        summary=digest_data.summary,
        key_insights=digest_data.key_insights,
        sentiment=digest_data.sentiment,
        duration_minutes=digest_data.duration_minutes,
        trio_cost_usdc=digest_data.trio_cost_usdc
    )

    db.add(digest)
    db.commit()
    db.refresh(digest)

    # Send to owner if agent has owner
    if agent and agent.owner_telegram_id:
        digest_dict = {
            "digest_id": digest.digest_id,
            "agent_id": digest.agent_id,
            "summary": digest.summary,
            "key_insights": digest.key_insights,
            "sentiment": digest.sentiment,
            "duration_minutes": digest.duration_minutes,
            "trio_cost_usdc": digest.trio_cost_usdc
        }

        await notification_service.send_digest_to_owner(
            agent.owner_telegram_id,
            digest_dict
        )

        digest.sent_to_owner = True
        digest.sent_at = datetime.utcnow()
        db.commit()

    return digest


@app.get("/digests/{digest_id}", response_model=DigestResponse)
async def get_digest(digest_id: str, db: Session = next(get_db())):
    """Get digest information"""

    digest = db.query(Digest).filter(Digest.digest_id == digest_id).first()
    if not digest:
        raise HTTPException(status_code=404, detail="Digest not found")

    return digest


# ==================== HEALTH & INFO ====================

@app.get("/")
async def root():
    """API root"""

    return {
        "name": "Clawnema API",
        "version": "1.0.0",
        "description": "Agent-Only Cinema Experience Platform",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    """Health check"""

    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.environment
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
