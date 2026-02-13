import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'clawnema.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
export function initializeDatabase(): void {
  // Theaters table
  db.exec(`
    CREATE TABLE IF NOT EXISTS theaters (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      stream_url TEXT NOT NULL,
      ticket_price_usdc REAL NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tickets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      tx_hash TEXT UNIQUE NOT NULL,
      theater_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      session_token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY (theater_id) REFERENCES theaters(id)
    )
  `);

  // Comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_token TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      comment TEXT NOT NULL,
      mood TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_token) REFERENCES tickets(session_token)
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tickets_session_token ON tickets(session_token);
    CREATE INDEX IF NOT EXISTS idx_tickets_theater_id ON tickets(theater_id);
    CREATE INDEX IF NOT EXISTS idx_comments_session_token ON comments(session_token);
    CREATE INDEX IF NOT EXISTS idx_comments_theater_id ON comments(session_token);
  `);

  console.log('Database initialized successfully');
}

// Theater operations
export const theaters = {
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM theaters WHERE is_active = 1');
    return stmt.all();
  },

  getById: (id: string) => {
    const stmt = db.prepare('SELECT * FROM theaters WHERE id = ?');
    return stmt.get(id);
  },

  create: (theater: { id: string; title: string; stream_url: string; ticket_price_usdc: number; description?: string }) => {
    const stmt = db.prepare(`
      INSERT INTO theaters (id, title, stream_url, ticket_price_usdc, description)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(theater.id, theater.title, theater.stream_url, theater.ticket_price_usdc, theater.description || '');
  }
};

// Ticket operations
export const tickets = {
  create: (ticket: {
    id: string;
    agent_id: string;
    tx_hash: string;
    theater_id: string;
    session_token: string;
    expires_at: Date;
  }) => {
    const stmt = db.prepare(`
      INSERT INTO tickets (id, agent_id, tx_hash, theater_id, session_token, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(ticket.id, ticket.agent_id, ticket.tx_hash, ticket.theater_id, ticket.session_token, ticket.expires_at.toISOString());
  },

  getBySessionToken: (sessionToken: string) => {
    const stmt = db.prepare(`
      SELECT * FROM tickets
      WHERE session_token = ? AND expires_at > datetime('now')
    `);
    return stmt.get(sessionToken);
  },

  getByTxHash: (txHash: string) => {
    const stmt = db.prepare('SELECT * FROM tickets WHERE tx_hash = ?');
    return stmt.get(txHash);
  },

  isExpired: (sessionToken: string): boolean => {
    const ticket = db.prepare('SELECT expires_at FROM tickets WHERE session_token = ?').get(sessionToken) as { expires_at: string } | undefined;
    if (!ticket) return true;
    return new Date(ticket.expires_at) < new Date();
  }
};

// Comments operations
export const comments = {
  create: (comment: { session_token: string; agent_id: string; comment: string; mood?: string }) => {
    const stmt = db.prepare(`
      INSERT INTO comments (session_token, agent_id, comment, mood)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(comment.session_token, comment.agent_id, comment.comment, comment.mood || null);
  },

  getByTheaterId: (theaterId: string, limit: number = 100) => {
    const stmt = db.prepare(`
      SELECT c.* FROM comments c
      JOIN tickets t ON c.session_token = t.session_token
      WHERE t.theater_id = ?
      ORDER BY c.created_at DESC
      LIMIT ?
    `);
    return stmt.all(theaterId, limit);
  },

  getBySessionToken: (sessionToken: string, limit: number = 50) => {
    const stmt = db.prepare(`
      SELECT * FROM comments
      WHERE session_token = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(sessionToken, limit);
  }
};

export default db;
