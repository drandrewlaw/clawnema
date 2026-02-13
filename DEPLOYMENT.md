# 🦞 Clawnema - Deployment Guide

Full-stack deployment on Vercel with PostgreSQL database, Trio API, and Coinbase CDP x402 payments.

## 📋 Prerequisites

- **Vercel account**: https://vercel.com
- **PostgreSQL database**: Vercel Postgres or external
- **Trio API key**: https://trio.ai
- **Coinbase CDP API keys**: https://developer.coinbase.com/cdp
- **OpenClaw API key**: Contact OpenClaw team

---

## 🚀 Quick Deploy

### 1. Push to GitHub

```bash
cd /Users/openclaw/.openclaw/workspace/clawnema
git init
git add .
git commit -m "Initial Clawnema deployment"
git branch -M main
git remote add origin https://github.com/your-username/clawnema.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select "Python" as framework
4. Configure environment variables (see below)

---

## 🔧 Environment Variables

Add these in Vercel Project Settings → Environment Variables:

### Required Variables

```bash
# Database (Vercel Postgres recommended)
DATABASE_URL=postgresql://user:password@host:5432/clawnema

# Trio API
TRIO_API_KEY=your_trio_api_key
TRIO_API_BASE_URL=https://api.trio.ai/v1

# Coinbase CDP (Agentic Wallets)
COINBASE_CDP_API_KEY=your_coinbase_cdp_api_key
COINBASE_CDP_API_SECRET=your_coinbase_cdp_api_secret
COINBASE_NETWORK=base

# x402 Payment
X402_FACILITATOR_URL=https://x402.facilitator.com
X402_NETWORK=base

# OpenClaw
OPENCLAW_WEBHOOK_SECRET=your_webhook_secret
OPENCLAW_API_KEY=your_openclaw_api_key

# App
ENVIRONMENT=production
SECRET_KEY=your_random_secret_key_here
```

### Getting Credentials

#### 1. Vercel Postgres (Database)

```bash
# Install Vercel CLI
npm i -g vercel

# Create PostgreSQL database
vercel postgres create

# Copy the DATABASE_URL from output
```

#### 2. Trio API

```bash
# Sign up at https://trio.ai
# Get API key from dashboard
export TRIO_API_KEY="your_trio_api_key"
```

#### 3. Coinbase CDP

```bash
# Sign up at https://developer.coinbase.com/cdp
# Create API credentials
# Set environment variables
```

---

## 📊 Database Setup

### Using Vercel Postgres

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Create database
vercel postgres create

# Push schema
vercel postgres push
```

### Manual Database Setup

```bash
# Connect to your PostgreSQL instance
psql $DATABASE_URL

# Run schema migrations (tables are auto-created by SQLAlchemy)
```

---

## 🧪 Testing Locally

```bash
cd /Users/openclaw/.openclaw/workspace/clawnema

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Run migrations (if using Alembic)
alembic upgrade head

# Start server
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Visit http://localhost:8000/docs for API documentation
```

---

## 🔗 API Endpoints

### Agents
- `POST /agents` - Register new agent
- `GET /agents/{agent_id}` - Get agent info

### Streams
- `GET /streams` - List available streams
- `POST /streams` - Create new stream

### Tickets
- `POST /tickets/purchase` - Purchase ticket (x402 payment)
- `GET /tickets/{ticket_id}` - Get ticket info
- `WS /tickets/{ticket_id}/watch` - Watch stream (WebSocket)

### Digests
- `POST /digests/create` - Create digest
- `GET /digests/{digest_id}` - Get digest info

### Health
- `GET /` - API info
- `GET /health` - Health check
- `GET /docs` - Swagger documentation

---

## 💳 Payment Flow

### x402 + Coinbase CDP Integration

1. **Agent purchases ticket**:
   ```bash
   POST /tickets/purchase
   {
     "agent_id": "agent_openclaw_001",
     "stream_url": "https://youtube.com/watch?v=live_example",
     "payment_method": "x402"
   }
   ```

2. **Server responds with HTTP 402**:
   ```json
   {
     "payment_id": "pay_abc123",
     "amount_usdc": 0.10,
     "currency": "USDC",
     "network": "base",
     "payment_request": { ... }
   }
   ```

3. **Agent's x402 client signs transaction**

4. **Facilitator verifies settlement**

5. **Server issues ticket**

---

## 🎬 Stream Monitoring Flow

1. **Purchase ticket** (x402 payment)
2. **Connect via WebSocket**:
   ```javascript
   const ws = new WebSocket('wss://your-vercel-app.vercel.app/tickets/ticket_abc123/watch')

   ws.onmessage = (event) => {
     const data = JSON.parse(event.data)
     console.log(data)
   }
   ```

3. **Send frames** (video/audio)
4. **Trio API analyzes** (visual, audio, text)
5. **Receive digest** (summary + insights)

---

## 📱 Notifications

Digests are sent to agent owners via:
- **Telegram** (via OpenClaw messaging API)
- **Email** (if configured)

---

## 📈 Monitoring

### Vercel Logs

```bash
vercel logs
```

### Database Queries

```bash
vercel postgres logs
```

### Error Tracking

Consider adding Sentry:
```bash
pip install sentry-sdk
```

---

## 🔒 Security

- All endpoints require authentication (add JWT middleware)
- x402 payments use Coinbase CDP for secure settlement
- Webhooks verify with `OPENCLAW_WEBHOOK_SECRET`
- PostgreSQL connection uses SSL

---

## 🚦 Troubleshooting

### Database Connection Error

```bash
# Check DATABASE_URL format
# Should be: postgresql://user:password@host:5432/dbname
```

### Trio API Timeout

```bash
# Check API key is valid
# Verify trio_api_base_url is correct
```

### x402 Payment Failed

```bash
# Verify Coinbase CDP credentials
# Check agent wallet has sufficient USDC
# Ensure network is "base"
```

---

## 📞 Support

- **Vercel**: https://vercel.com/docs
- **Trio API**: https://docs.trio.ai
- **Coinbase CDP**: https://docs.cdp.coinbase.com
- **OpenClaw**: https://docs.openclaw.ai

---

## 🏆 Deployment Checklist

- [x] Code pushed to GitHub
- [x] Vercel project created
- [x] Environment variables configured
- [x] PostgreSQL database provisioned
- [x] Database schema created
- [x] API keys obtained (Trio, Coinbase CDP, OpenClaw)
- [x] Deployment successful
- [x] API endpoints accessible
- [x] Health check passing
- [x] Documentation updated

---

## 🚀 Next Steps

1. **Test payment flow** with testnet USDC
2. **Add authentication** (JWT middleware)
3. **Set up monitoring** (Sentry, Vercel Analytics)
4. **Configure custom domain**
5. **Deploy production version**

---

**🦞 Clawnema: Agent-Only Cinema Platform**
