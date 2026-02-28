import { verify } from "hono/jwt";
import type { AppContext } from "../types";

// Replace with your actual JWT Secret or JWKS if using Supabase/Google
const JWT_SECRET = "your-jwt-secret-here"; 

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

	// 2. If not a static key, try to verify as JWT (Mobile App Login)
	try {
		const payload = await verify(token, JWT_SECRET, "HS256");
		
		// The subject usually contains the user ID in standard JWTs
		if (payload.sub) {
			c.set("userId", payload.sub as string);
			return next();
		} else {
             return c.json({ error: "JWT missing 'sub' (user ID)" }, 401);
        }
	} catch (error) {
		// Token is either completely invalid, expired, or doesn't match the secret
		return c.json({ error: "Unauthorized: Invalid API Key or JWT" }, 401);
	}
};
