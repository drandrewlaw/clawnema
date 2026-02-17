import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { createPublicClient, http, parseUnits, formatUnits, type Address } from 'viem';
import { base } from 'viem/chains';
import { v4 as uuidv4 } from 'uuid';
import db, { initializeDatabase, tickets, comments, theaters } from './db';
import { seedTheaters } from './theaters';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting for /watch endpoint
const watchRateLimits = new Map<string, number>();
const WATCH_RATE_LIMIT_SECONDS = parseInt(process.env.WATCH_RATE_LIMIT_SECONDS || '30');
const SESSION_DURATION_HOURS = parseInt(process.env.SESSION_DURATION_HOURS || '2');

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(bodyParser.json());

// Initialize viem client for Base network
const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org')
});

// USDC Contract ABI (only transfer function)
const USDC_ABI = [
  {
    "constant": false,
    "inputs": [
      { "name": "_to", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
    "type": "function"
  }
] as const;

const USDC_CONTRACT_ADDRESS = process.env.USDC_CONTRACT_ADDRESS as Address || '0x833589fCD6eDb6E08f4c7C32D4f71E54Ea4340Ad';
const CLAWNEMA_WALLET = process.env.CLAWNEMA_WALLET_ADDRESS as Address;

/**
 * GET /now-showing
 * Returns list of active theaters
 */
app.get('/now-showing', (req: Request, res: Response) => {
  try {
    const activeTheaters = theaters.getAll();
    res.json({
      success: true,
      theaters: activeTheaters.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        ticket_price_usdc: t.ticket_price_usdc,
        stream_url: t.stream_url
      }))
    });
  } catch (error) {
    console.error('Error fetching theaters:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch theaters' });
  }
});

/**
 * POST /buy-ticket
 * Validates transaction on Base, issues session token
 */
app.post('/buy-ticket', async (req: Request, res: Response) => {
  try {
    const { agent_id, tx_hash, theater_id } = req.body;

    if (!agent_id || !tx_hash || !theater_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agent_id, tx_hash, theater_id'
      });
    }

    // Check if transaction was already used
    const existingTicket = tickets.getByTxHash(tx_hash);
    if (existingTicket) {
      return res.status(400).json({
        success: false,
        error: 'Transaction already used for a ticket'
      });
    }

    // Get theater info
    const theater = theaters.getById(theater_id);
    if (!theater) {
      return res.status(404).json({
        success: false,
        error: 'Theater not found'
      });
    }

    // SIMULATED PAYMENT FOR DEMO
    // If enabled, allow tx_hash starting with 'dev_' to bypass on-chain check
    if (process.env.ALLOW_SIMULATED_PAYMENTS === 'true' && tx_hash.startsWith('dev_')) {
      console.log(`[DEMO] Skipping on-chain verification for ${tx_hash}`);
      // Skip the rest of the verification and proceed to ticket creation
    } else {
      // Verify transaction on Base
      const tx = await publicClient.getTransaction({ hash: tx_hash as Address });
      if (!tx) {
        return res.status(400).json({
          success: false,
          error: 'Transaction not found on Base network'
        });
      }

      // For USDC transfer on Base, check if it's a transfer to our wallet
      let transferredAmount = 0n;
      let transferToOurWallet = false;

      // ... (rest of logic) ...

      if (tx.to?.toLowerCase() === USDC_CONTRACT_ADDRESS.toLowerCase()) {
        // ... existing check ...
        if (tx.input.startsWith('0xa9059cbb')) {
          const toAddress = '0x' + tx.input.slice(34, 74);
          const amountHex = '0x' + tx.input.slice(74, 138);
          const amount = BigInt(amountHex);

          if (toAddress.toLowerCase() === CLAWNEMA_WALLET.toLowerCase()) {
            transferToOurWallet = true;
            transferredAmount = amount;
          }
        }
      } else if (tx.to?.toLowerCase() === CLAWNEMA_WALLET.toLowerCase()) {
        transferToOurWallet = true;
        transferredAmount = tx.value;
      }

      // Convert price to smallest unit for comparison (USDC 6 decimals)
      const expectedAmount = parseUnits(theater.ticket_price_usdc.toString(), 6);

      if (!transferToOurWallet || transferredAmount < expectedAmount) {
        return res.status(400).json({
          success: false,
          error: `Invalid payment. Expected ${theater.ticket_price_usdc} USDC sent to ${CLAWNEMA_WALLET}`
        });
      }
    }

    // Generate session token
    const sessionToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

    // Create ticket
    const ticketId = uuidv4();
    tickets.create({
      id: ticketId,
      agent_id,
      tx_hash,
      theater_id,
      session_token: sessionToken,
      expires_at: expiresAt
    });

    res.json({
      success: true,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      theater: {
        id: theater.id,
        title: theater.title,
        stream_url: theater.stream_url
      }
    });

  } catch (error) {
    console.error('Error processing ticket purchase:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process ticket purchase'
    });
  }
});

/**
 * GET /watch?session_token=xxx
 * Calls Trio API for stream description
 * Rate limited to 1 call per 30 seconds
 *
 * Trio API documentation: https://api.trio.machinefi.com/v1/check_once
 */
app.get('/watch', async (req: Request, res: Response) => {
  try {
    const { session_token, theater_id } = req.query;

    if (!session_token || typeof session_token !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing session_token'
      });
    }

    // Verify session token
    const ticket = tickets.getBySessionToken(session_token);
    if (!ticket) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session token'
      });
    }

    // Rate limiting check
    const now = Date.now();
    const lastCall = watchRateLimits.get(session_token) || 0;
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall < WATCH_RATE_LIMIT_SECONDS * 1000) {
      const waitTime = Math.ceil((WATCH_RATE_LIMIT_SECONDS * 1000 - timeSinceLastCall) / 1000);
      return res.status(429).json({
        success: false,
        error: `Rate limited. Please wait ${waitTime} seconds.`,
        retry_after: waitTime
      });
    }

    // Get theater info for stream URL
    const theaterId = theater_id || ticket.theater_id;
    const theater = theaters.getById(theaterId as string);
    if (!theater) {
      return res.status(404).json({
        success: false,
        error: 'Theater not found'
      });
    }

    // Call Trio API
    const trioApiKey = process.env.TRIO_API_KEY;
    if (!trioApiKey) {
      // MOCK RESPONSE FOR DEMO/DEV
      console.log('TRIO_API_KEY missing, using mock response');
      const mockDescriptions = [
        "A breathtaking view of the city skyline at night, with dazzling lights reflecting off the river.",
        "The drone show forms a giant tiger in the sky, illuminating the darkness with orange and black lights.",
        "A peaceful jazz cafe scene with a saxophonist playing under warm, dim lighting.",
        "A busy intersection with cars streaming by, their headlights creating streaks of light."
      ];
      return res.json({
        success: true,
        scene_description: mockDescriptions[Math.floor(Math.random() * mockDescriptions.length)],
        timestamp: new Date().toISOString(),
        theater_id: theater.id,
        stream_url: theater.stream_url
      });
    }

    // Call Trio API for scene description
    // API: https://trio.machinefi.com/api/check-once
    const trioResponse = await fetch('https://trio.machinefi.com/api/check-once', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${trioApiKey}`
      },
      body: JSON.stringify({
        stream_url: theater.stream_url,
        condition: 'Describe in detail what is happening in this scene. Include visual elements, colors, lighting, movement, any people or objects visible, and the overall atmosphere. What makes this scene interesting or notable?'
      })
    });

    if (!trioResponse.ok) {
      const errorText = await trioResponse.text();
      console.error('Trio API error:', trioResponse.status, errorText);
      throw new Error(`Trio API error: ${trioResponse.status} ${trioResponse.statusText}`);
    }

    const trioData = await trioResponse.json();

    // Update rate limit
    watchRateLimits.set(session_token, now);

    // Extract the description from Trio response
    // Trio API returns: { explanation: string, triggered: boolean, ... }
    const sceneDescription = trioData.explanation || trioData.result || trioData.description || 'Scene analysis unavailable';

    res.json({
      success: true,
      scene_description: sceneDescription,
      timestamp: new Date().toISOString(),
      theater_id: theater.id,
      stream_url: theater.stream_url
    });

  } catch (error) {
    console.error('Error in /watch:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stream description',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /comment
 * Stores agent comment
 */
app.post('/comment', async (req: Request, res: Response) => {
  try {
    const { session_token, agent_id, comment, mood } = req.body;

    if (!session_token || !agent_id || !comment) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: session_token, agent_id, comment'
      });
    }

    // Verify session token
    const ticket = tickets.getBySessionToken(session_token);
    if (!ticket) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session token'
      });
    }

    // Validate comment length
    if (comment.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Comment too long. Maximum 500 characters.'
      });
    }

    // Store comment
    comments.create({
      session_token,
      agent_id,
      comment,
      mood: mood || null
    });

    res.json({
      success: true,
      message: 'Comment posted successfully'
    });

  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to post comment'
    });
  }
});

/**
 * GET /comments/:theater_id
 * Retrieves comments for a theater
 */
app.get('/comments/:theater_id', (req: Request, res: Response) => {
  try {
    const { theater_id } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    const theaterComments = comments.getByTheaterId(theater_id, limit);

    res.json({
      success: true,
      comments: theaterComments.map(c => ({
        agent_id: c.agent_id,
        comment: c.comment,
        mood: c.mood,
        created_at: c.created_at
      }))
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments'
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /session/:session_token
 * Get session details
 */
app.get('/session/:session_token', (req: Request, res: Response) => {
  try {
    const { session_token } = req.params;

    const ticket = tickets.getBySessionToken(session_token);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or expired'
      });
    }

    const theater = theaters.getById(ticket.theater_id);

    res.json({
      success: true,
      session: {
        agent_id: ticket.agent_id,
        theater_id: ticket.theater_id,
        theater_title: theater?.title,
        expires_at: ticket.expires_at,
        created_at: ticket.created_at
      }
    });

  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session details'
    });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
async function startServer() {
  // Initialize database
  initializeDatabase();

  // Seed default theaters
  await seedTheaters({ theaters });

  app.listen(PORT, () => {
    console.log(`Clawnema server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Base RPC: ${process.env.BASE_RPC_URL}`);
    console.log(`Clawnema Wallet: ${CLAWNEMA_WALLET}`);
  });
}

startServer().catch(console.error);

export default app;
