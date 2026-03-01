import { createRemoteJWKSet, jwtVerify } from "jose";
import type { AppContext } from "../types";

// Polyfill the global Request/Response/fetch for 'jose' library to fetch the JWKS correctly
/* global fetch */

// The JWT_SECRET is now accessed from the environment variables (c.env.JWT_SECRET)
export const authMiddleware = async (c: AppContext, next: () => Promise<void>) => {
	const authHeader = c.req.header("Authorization");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return c.json({ error: "Missing or invalid Authorization header" }, 401);
	}

	const token = authHeader.split("Bearer ")[1];

	// 1. Try to find a static API key for iOS Shortcuts
	const keyResult = await c.env.DB.prepare(
		`SELECT user_id FROM api_keys WHERE key = ?`
	)
		.bind(token)
		.first<{ user_id: string }>();

	if (keyResult) {
		// Found static key
		c.set("userId", keyResult.user_id);
		return next();
	}

	// 2. Verify JWT using Supabase JWKS (JSON Web Key Set)
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
