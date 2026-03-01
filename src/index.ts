import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { TransactionCreate } from "./endpoints/transactionCreate";
import { TransactionDelete } from "./endpoints/transactionDelete";
import { TransactionFetch } from "./endpoints/transactionFetch";
import { TransactionList } from "./endpoints/transactionList";
import { TransactionUpdate } from "./endpoints/transactionUpdate";
import { authMiddleware } from "./middleware/auth";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
});

// Enable CORS for all routes (Crucial for Web Mobile Frontend)
openapi.use("/api/*", cors());

// Setup security schemes globally for Chanfana docs
openapi.registry.registerComponent("securitySchemes", "BearerAuth", {
	type: "http",
	scheme: "bearer",
});

// Protect all /api routes via middleware
openapi.use("/api/*", authMiddleware);

// Register OpenAPI endpoints

openapi.get("/api/transactions", TransactionList);
openapi.post("/api/transactions", TransactionCreate);
openapi.get("/api/transactions/:id", TransactionFetch);
openapi.put("/api/transactions/:id", TransactionUpdate);
openapi.delete("/api/transactions/:id", TransactionDelete);

// You may also register routes for non OpenAPI directly on Hono
// app.get('/test', (c) => c.text('Hono!'))

// Export the Hono app
export default app;
