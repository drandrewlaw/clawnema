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

// ──────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────

/**
 * Sleep helper for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call Trio API with retry logic and graceful degradation
 * Handles rate limits (429) and server errors (5xx)
 */
async function callTrioWithRetry(streamUrl: string, condition: string, maxRetries: number = 3): Promise<{ description: string | null; usedFallback: boolean; attempts: number }> {
  const trioApiKey = process.env.TRIO_API_KEY;
  const fallbackDescriptions = [
    "A breathtaking view of the city skyline at night, with dazzling lights reflecting off the river.",
    "The drone show forms a giant tiger in the sky, illuminating the darkness with orange and black lights.",
    "A peaceful jazz cafe scene with a saxophonist playing under warm, dim lighting.",
    "A busy intersection with cars streaming by, their headlights creating streaks of light.",
    "A stunning display of coordinated lights dancing across the night sky.",
    "The serenity of the scene invites quiet contemplation and appreciation.",
    "Vibrant colors and movements create a mesmerizing visual experience."
  ];

  // If no API key, use fallback immediately
  if (!trioApiKey) {
    console.log('[Trio] No API key, using fallback response');
    return {
      description: fallbackDescriptions[Math.floor(Math.random() * fallbackDescriptions.length)],
      usedFallback: true,
      attempts: 0
    };
  }

  let lastError: string | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Trio] Attempt ${attempt}/${maxRetries} for stream: ${streamUrl.slice(0, 50)}...`);

      const response = await fetch('https://trio.machinefi.com/api/check-once', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${trioApiKey}`
        },
        body: JSON.stringify({
          stream_url: streamUrl,
          condition: condition
        })
      });

      if (response.ok) {
        const data = await response.json();
        const description = data.explanation || data.result || data.description || 'Scene analysis unavailable';
        console.log(`[Trio] Success on attempt ${attempt}`);
        return {
          description,
          usedFallback: false,
          attempts: attempt
        };
      }

      // Rate limited (429) or server error (5xx) - retry
      if (response.status === 429 || response.status >= 500) {
        const waitTime = attempt * 2000; // 2s, 4s, 6s
        lastError = `HTTP ${response.status}`;
        console.log(`[Trio] ${lastError}, retry in ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }

      // Other errors - don't retry, break out to fallback
      lastError = `HTTP ${response.status}: ${response.statusText}`;
      console.error(`[Trio] ${lastError}`);
      break;

    } catch (error: any) {
      lastError = error.message || 'Unknown error';
      console.error(`[Trio] Attempt ${attempt} failed:`, lastError);

      // Only retry on last attempt
      if (attempt < maxRetries) {
        const waitTime = 1000 * attempt;
        console.log(`[Trio] Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
      }
    }
  }

  // All retries failed - use fallback
  console.warn('[Trio] All retries failed, using fallback response');
  return {
    description: fallbackDescriptions[Math.floor(Math.random() * fallbackDescriptions.length)],
    usedFallback: true,
    attempts: maxRetries
  };
}

/**
 * Quick health check helper for backend status
 */
async function checkBackendHealth(): Promise<boolean> {
  try {
    // Check if database is accessible
    const theaterCount = theaters.getAll().length;
    return theaterCount >= 0;
  } catch (error) {
    console.error('[Health] Backend health check failed:', error);
    return false;
  }
}

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
      // Skip rest of verification and proceed to ticket creation
    } else {
      // Verify payment on Base using transaction receipt logs
      // This supports both direct transfers AND ERC-4337 smart wallets (Coinbase awal)
      // which bundle USDC transfers inside handleOps calls to the EntryPoint contract.

      if (!CLAWNEMA_WALLET) {
        console.error('[Ticket] CLAWNEMA_WALLET_ADDRESS not configured');
        return res.status(503).json({
          success: false,
          error: 'Server wallet not configured. Contact admin.'
        });
      }

      // Fetch transaction receipt with retry (for propagation delay)
      let receipt = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          receipt = await publicClient.getTransactionReceipt({ hash: tx_hash as Address });
          if (receipt) break;
        } catch (e: any) {
          console.log(`[Ticket] Receipt lookup attempt ${attempt}/3 failed: ${e.shortMessage || e.message}`);
        }
        if (attempt < 3) await sleep(3000);
      }

      if (!receipt) {
        return res.status(400).json({
          success: false,
          error: 'Transaction not found on Base network. It may still be propagating — try again in 10 seconds.'
        });
      }

      if (receipt.status === 'reverted') {
        return res.status(400).json({
          success: false,
          error: 'Transaction was reverted on-chain.'
        });
      }

      // Scan receipt logs for ERC-20 Transfer events to the Clawnema wallet
      // Transfer event: Transfer(address from, address to, uint256 value)
      // topic[0] = keccak256("Transfer(address,address,uint256)")
      const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
      const clawnemaWalletPadded = ('0x' + CLAWNEMA_WALLET.slice(2).toLowerCase().padStart(64, '0')) as `0x${string}`;

      let transferredAmount = 0n;
      let transferFound = false;

      for (const log of receipt.logs) {
        // Match: Transfer event where topic[2] (to) is the Clawnema wallet
        if (
          log.topics[0] === TRANSFER_TOPIC &&
          log.topics.length >= 3 &&
          log.topics[2]?.toLowerCase() === clawnemaWalletPadded
        ) {
          const amount = BigInt(log.data);
          console.log(`[Ticket] Found Transfer to Clawnema wallet: ${amount} from token ${log.address}`);
          transferredAmount += amount;
          transferFound = true;
        }
      }

      // Convert price to smallest unit for comparison (USDC 6 decimals)
      const expectedAmount = parseUnits(theater.ticket_price_usdc.toString(), 6);

      if (!transferFound || transferredAmount < expectedAmount) {
        return res.status(400).json({
          success: false,
          error: `Invalid payment. Expected ${theater.ticket_price_usdc} USDC sent to ${CLAWNEMA_WALLET}. Found: ${transferFound ? formatUnits(transferredAmount, 6) + ' USDC' : 'no transfer'}`
        });
      }

      console.log(`[Ticket] Payment verified: ${formatUnits(transferredAmount, 6)} USDC to ${CLAWNEMA_WALLET}`);
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
 * Calls Trio API for stream description with retry and fallback
 * Rate limited to 1 call per 30 seconds
 *
 * IMPROVEMENTS:
 * - Retry logic for rate limits and transient failures
 * - Graceful degradation with fallback responses
 * - Better error messages and logging
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

    // Call Trio API with retry and fallback
    const condition = 'Describe in detail what is happening in this scene. Include visual elements, colors, lighting, movement, any people or objects visible, and the overall atmosphere. What makes this scene interesting or notable?';
    const trioResult = await callTrioWithRetry(theater.stream_url, condition, 3);

    // Update rate limit
    watchRateLimits.set(session_token, now);

    // Build response with metadata about API call
    const responseData: any = {
      success: true,
      scene_description: trioResult.description,
      timestamp: new Date().toISOString(),
      theater_id: theater.id,
      stream_url: theater.stream_url,
      rate_limit_seconds: WATCH_RATE_LIMIT_SECONDS
    };

    // Add warning if fallback was used
    if (trioResult.usedFallback) {
      responseData.warning = 'Trio API unavailable, using cached response';
      console.warn(`[Watch] Returning fallback response after ${trioResult.attempts} failed attempts`);
    }

    res.json(responseData);

  } catch (error) {
    console.error('Error in /watch:', error);
    // Return fallback instead of 500 so agents always get a response
    res.json({
      success: true,
      scene_description: 'A captivating scene unfolds on screen.',
      timestamp: new Date().toISOString(),
      theater_id: req.query.theater_id || 'unknown',
      warning: 'Scene analysis temporarily unavailable',
      rate_limit_seconds: WATCH_RATE_LIMIT_SECONDS
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

// ──────────────────────────────────────────────
// Admin Endpoints
// ──────────────────────────────────────────────

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!ADMIN_API_KEY) {
    return res.status(503).json({ success: false, error: 'Admin API not configured' });
  }
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${ADMIN_API_KEY}`) {
    return res.status(401).json({ success: false, error: 'Invalid admin key' });
  }
  next();
}

/**
 * POST /admin/theaters
 * Add a new theater (admin only)
 */
app.post('/admin/theaters', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id, title, stream_url, ticket_price_usdc, description } = req.body;

    if (!id || !title || !stream_url || ticket_price_usdc == null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, title, stream_url, ticket_price_usdc'
      });
    }

    // Validate stream URL is YouTube
    if (!stream_url.includes('youtube.com/') && !stream_url.includes('youtu.be/')) {
      return res.status(400).json({
        success: false,
        error: 'stream_url must be a YouTube URL'
      });
    }

    // Check if theater already exists
    const existing = theaters.getById(id);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Theater "${id}" already exists`
      });
    }

    theaters.create({
      id,
      title,
      stream_url,
      ticket_price_usdc: parseFloat(ticket_price_usdc),
      description: description || ''
    });

    console.log(`[Admin] Added theater: ${title} (${id})`);

    res.status(201).json({
      success: true,
      theater: { id, title, stream_url, ticket_price_usdc, description }
    });
  } catch (error) {
    console.error('Error adding theater:', error);
    res.status(500).json({ success: false, error: 'Failed to add theater' });
  }
});

/**
 * DELETE /admin/theaters/:id
 * Remove a theater (admin only)
 */
app.delete('/admin/theaters/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = theaters.getById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Theater not found' });
    }

    const stmt = db.prepare('DELETE FROM theaters WHERE id = ?');
    stmt.run(id);

    console.log(`[Admin] Removed theater: ${id}`);
    res.json({ success: true, message: `Theater "${id}" removed` });
  } catch (error) {
    console.error('Error removing theater:', error);
    res.status(500).json({ success: false, error: 'Failed to remove theater' });
  }
});

/**
 * GET /admin/theaters
 * List all theaters with stats (admin only)
 */
app.get('/admin/theaters', requireAdmin, (req: Request, res: Response) => {
  try {
    const allTheaters = theaters.getAll();
    const stats = allTheaters.map((t: any) => {
      const theaterComments = comments.getByTheaterId(t.id);
      const uniqueAgents = new Set(theaterComments.map((c: any) => c.agent_id));
      return {
        ...t,
        comment_count: theaterComments.length,
        unique_agents: uniqueAgents.size
      };
    });
    res.json({ success: true, theaters: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to list theaters' });
  }
});

// ──────────────────────────────────────────────
// Health & Session Endpoints
// ──────────────────────────────────────────────

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', async (req: Request, res: Response) => {
  try {
    const isHealthy = await checkBackendHealth();
    const theaterCount = theaters.getAll().length;

    res.json({
      success: true,
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      theaters_available: theaterCount
    });
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
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

  // Check backend health on startup
  const healthy = await checkBackendHealth();
  if (healthy) {
    console.log('✅ Backend health check passed');
  } else {
    console.warn('⚠️ Backend health check failed, but continuing anyway');
  }

  app.listen(PORT, () => {
    console.log(`Clawnema server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Base RPC: ${process.env.BASE_RPC_URL}`);
    console.log(`Clawnema Wallet: ${CLAWNEMA_WALLET}`);
    console.log(`Trio API: ${process.env.TRIO_API_KEY ? 'configured' : 'not configured (using fallback)'}`);
    console.log(`Watch rate limit: ${WATCH_RATE_LIMIT_SECONDS}s`);
  });
}

startServer().catch(console.error);

export default app;
