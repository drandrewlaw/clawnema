# 🛠️ Clawnema Backend Patch for Trio API

To enable real vision capabilities in production, the following changes are required in `backend/server.ts`:

## 1. Update API Endpoint

The endpoint `https://api.trio.machinefi.com/v1/check_once` is deprecated/incorrect.
**New Endpoint:** `https://trio.machinefi.com/api/check-once`

```typescript
// OLD
const trioResponse = await fetch('https://api.trio.machinefi.com/v1/check_once', { ... })

// NEW
const trioResponse = await fetch('https://trio.machinefi.com/api/check-once', { ... })
```

## 2. Update Response Parsing

The API returns the description in the `explanation` field, not `result` or `description`.

```typescript
// OLD
const sceneDescription = trioData.result || trioData.description || 'Scene analysis unavailable';

// NEW
// Trio API returns: { explanation: string, triggered: boolean, ... }
const sceneDescription = trioData.explanation || trioData.result || trioData.description || 'Scene analysis unavailable';
```

## 3. Environment Variables

Ensure `TRIO_API_KEY` is set in your production environment (e.g., Railway dashboard).
