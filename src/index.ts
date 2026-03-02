import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { TransactionCreate } from "./endpoints/transactionCreate";
import { TransactionDelete } from "./endpoints/transactionDelete";
import { TransactionFetch } from "./endpoints/transactionFetch";
import { TransactionList } from "./endpoints/transactionList";
import { TransactionUpdate } from "./endpoints/transactionUpdate";
import { ApiKeyFetch } from "./endpoints/apiKeyFetch";
import { ApiKeyGenerate } from "./endpoints/apiKeyGenerate";
import { RecurringList } from "./endpoints/recurringList";
import { RecurringCreate } from "./endpoints/recurringCreate";
import { RecurringUpdate } from "./endpoints/recurringUpdate";
import { RecurringDelete } from "./endpoints/recurringDelete";
import { TransactionMonthlySummary } from "./endpoints/transactionMonthlySummary";
import { authMiddleware } from "./middleware/auth";
export { scheduled } from "./cron";

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

// ── Transactions ──
openapi.get("/api/transactions", TransactionList);
openapi.get("/api/transactions/summary/monthly", TransactionMonthlySummary);
openapi.post("/api/transactions", TransactionCreate);
openapi.get("/api/transactions/:id", TransactionFetch);
openapi.put("/api/transactions/:id", TransactionUpdate);
openapi.delete("/api/transactions/:id", TransactionDelete);

// ── Recurring Rules ──
openapi.get("/api/recurring", RecurringList);
openapi.post("/api/recurring", RecurringCreate);
openapi.put("/api/recurring/:id", RecurringUpdate);
openapi.delete("/api/recurring/:id", RecurringDelete);

// ── API Keys ──
openapi.get("/api/keys", ApiKeyFetch);
openapi.post("/api/keys", ApiKeyGenerate);

// Export the Hono app
export default app;
