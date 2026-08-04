import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { AppContext } from '../types';

// In-memory cache for JWKS resolvers and valid API keys across requests within the Worker isolate
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
const apiKeyCache = new Map<string, { userId: string; expiresAt: number }>();
const API_KEY_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

function getJWKS(supabaseUrl: string) {
  let jwks = jwksCache.get(supabaseUrl);
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`),
      {
        // Cache JWKS in memory for 10 minutes to avoid repeated HTTP calls to Supabase
        cacheMaxAge: 600000,
      },
    );
    jwksCache.set(supabaseUrl, jwks);
  }
  return jwks;
}

export const authMiddleware = async (
  c: AppContext,
  next: () => Promise<void>,
) => {
  const authHeader = c.req.header('Authorization');
  const apiKeyHeader = c.req.header('X-API-Key');

  // 1. Try to authenticate via static API key (e.g., iOS Shortcuts or Local Dev)
  if (apiKeyHeader) {
    if (apiKeyHeader === 'local-dev-api-key') {
      c.set('userId', 'local_user');
      c.set('userDisplayName', 'Local User');
      return next();
    }

    // Check in-memory cache first
    const cachedKey = apiKeyCache.get(apiKeyHeader);
    if (cachedKey && cachedKey.expiresAt > Date.now()) {
      c.set('userId', cachedKey.userId);
      c.set('userDisplayName', cachedKey.userId.slice(0, 8));
      return next();
    }

    const keyResult = await c.env.DB.prepare(
      `SELECT user_id FROM api_keys WHERE key = ?`,
    )
      .bind(apiKeyHeader)
      .first<{ user_id: string }>();

    if (keyResult) {
      apiKeyCache.set(apiKeyHeader, {
        userId: keyResult.user_id,
        expiresAt: Date.now() + API_KEY_TTL_MS,
      });
      c.set('userId', keyResult.user_id);
      c.set('userDisplayName', keyResult.user_id.slice(0, 8));
      return next();
    }
    return c.json({ error: 'Unauthorized: Invalid X-API-Key provided' }, 401);
  }

  // 2. Dev bypass for dummy local testing when no Auth header is present
  if (
    !authHeader &&
    (c.req.url.includes('localhost') || c.req.url.includes('127.0.0.1'))
  ) {
    c.set('userId', 'local_user');
    c.set('userDisplayName', 'Local User');
    return next();
  }

  // 3. Fallback to Bearer JWT Session
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      { error: 'Missing or invalid Authorization header / X-API-Key' },
      401,
    );
  }

  const token = authHeader.split('Bearer ')[1];

  // Allow 'local-token' for quick manual testing
  if (token === 'local-token' || token === 'local_user') {
    c.set('userId', 'local_user');
    c.set('userDisplayName', 'Local User');
    return next();
  }

  // 4. Verify JWT using cached Supabase JWKS
  try {
    const supabaseUrl =
      c.env.SUPABASE_URL || 'https://zyaewkmgxsiqfnevcigz.supabase.co';
    const JWKS = getJWKS(supabaseUrl);

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${supabaseUrl}/auth/v1`,
      audience: 'authenticated',
    });

    if (payload && payload.sub) {
      c.set('userId', payload.sub);
      const meta = (payload.user_metadata as any) || {};
      const displayName =
        meta.display_name ||
        meta.full_name ||
        meta.name ||
        ((payload.email as string) || '').split('@')[0] ||
        'User';
      c.set('userDisplayName', displayName);
      return next();
    } else {
      return c.json({ error: 'Session missing User ID (sub)' }, 401);
    }
  } catch (error) {
    console.error('JWKS Token validation failed:', error);
    // Local development fallback if token expired or invalid locally
    if (c.req.url.includes('localhost') || c.req.url.includes('127.0.0.1')) {
      console.log('Local development fallback triggered — using local_user');
      c.set('userId', 'local_user');
      c.set('userDisplayName', 'Local User');
      return next();
    }
    return c.json(
      { error: 'Unauthorized: Invalid API Key or Session JWT', details: error },
      401,
    );
  }
};
