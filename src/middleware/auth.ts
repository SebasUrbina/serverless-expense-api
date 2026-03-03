import { createRemoteJWKSet, jwtVerify } from "jose";
import type { AppContext } from "../types";

// Polyfill the global Request/Response/fetch for 'jose' library to fetch the JWKS correctly
/* global fetch */

// The JWT_SECRET is now accessed from the environment variables (c.env.JWT_SECRET)
export const authMiddleware = async (c: AppContext, next: () => Promise<void>) => {
	const authHeader = c.req.header("Authorization");
	const apiKeyHeader = c.req.header("X-API-Key");

	// 1. Try to authenticate via static API key (e.g., iOS Shortcuts)
	if (apiKeyHeader) {
		const keyResult = await c.env.DB.prepare(`SELECT user_id FROM api_keys WHERE key = ?`)
			.bind(apiKeyHeader)
			.first<{ user_id: string }>();

		if (keyResult) {
			c.set("userId", keyResult.user_id);
			return next();
		}
		// If provided but invalid, fail fast
		return c.json({ error: "Unauthorized: Invalid X-API-Key provided" }, 401);
	}

	// 2. No API Key provided, fallback to standard Bearer JWT Session
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return c.json({ error: "Missing or invalid Authorization header / X-API-Key" }, 401);
	}

	const token = authHeader.split("Bearer ")[1];

	// 3. Verify JWT using Supabase JWKS (JSON Web Key Set)
	try {
		const JWKS = createRemoteJWKSet(
			new URL(`${c.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
		);

		const { payload } = await jwtVerify(token, JWKS, {
			issuer: `${c.env.SUPABASE_URL}/auth/v1`,
			audience: "authenticated",
		});

		if (payload && payload.sub) {
			c.set("userId", payload.sub);
			return next();
		} else {
			return c.json({ error: "Session missing User ID (sub)" }, 401);
		}
	} catch (error) {
		console.error("JWKS Token validation failed:", error);
		return c.json({ error: "Unauthorized: Invalid API Key or Session JWT", details: error }, 401);
	}
};
