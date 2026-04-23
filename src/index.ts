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
import { TransactionCategorySummary } from "./endpoints/transactionCategorySummary";
import { TransactionKpiSummary } from "./endpoints/transactionKpiSummary";
import { AppConfigFetch } from "./endpoints/appConfigFetch";
import { CategoryList } from "./endpoints/categoryList";
import { CategoryCreate } from "./endpoints/categoryCreate";
import { CategoryUpdate } from "./endpoints/categoryUpdate";
import { CategoryDelete } from "./endpoints/categoryDelete";
import { TagList } from "./endpoints/tagList";
import { TagCreate } from "./endpoints/tagCreate";
import { TagDelete } from "./endpoints/tagDelete";
import { AccountList } from "./endpoints/accountList";
import { AccountCreate } from "./endpoints/accountCreate";
import { AccountUpdate } from "./endpoints/accountUpdate";
import { AccountDelete } from "./endpoints/accountDelete";
import { UserSetup } from "./endpoints/userSetup";
import { GroupCreate } from "./endpoints/groupCreate";
import { GroupJoin } from "./endpoints/groupJoin";
import { GroupList } from "./endpoints/groupList";
import { GroupDelete } from "./endpoints/groupDelete";
import { GroupBalances } from "./endpoints/groupBalances";
import { GroupSettle } from "./endpoints/groupSettle";
import { GroupUpdate } from "./endpoints/groupUpdate";
import { ShortcutInit } from "./endpoints/shortcuts/shortcutInit";
import { ShortcutTransactionCreate } from "./endpoints/shortcuts/shortcutTransactionCreate";
import { authMiddleware } from "./middleware/auth";
import { scheduled } from "./cron";

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
openapi.registry.registerComponent("securitySchemes", "ApiKeyAuth", {
	type: "apiKey",
	name: "X-API-Key",
	in: "header",
});

// Protect all /api routes via middleware
openapi.use("/api/*", authMiddleware);

// ── Shortcuts ──
openapi.get("/api/shortcuts/init", ShortcutInit);
openapi.post("/api/shortcuts/transactions", ShortcutTransactionCreate);

// ── Transactions ──
openapi.get("/api/transactions", TransactionList);
openapi.get("/api/transactions/summary/monthly", TransactionMonthlySummary);
openapi.get("/api/transactions/summary/category", TransactionCategorySummary);
openapi.get("/api/transactions/summary/kpi", TransactionKpiSummary);
openapi.post("/api/transactions", TransactionCreate);
openapi.get("/api/transactions/:id", TransactionFetch);
openapi.put("/api/transactions/:id", TransactionUpdate);
openapi.delete("/api/transactions/:id", TransactionDelete);

// ── Recurring Rules ──
openapi.get("/api/recurring", RecurringList);
openapi.post("/api/recurring", RecurringCreate);
openapi.put("/api/recurring/:id", RecurringUpdate);
openapi.delete("/api/recurring/:id", RecurringDelete);

// ── Shared Groups ──
openapi.get("/api/groups", GroupList);
openapi.post("/api/groups", GroupCreate);
openapi.post("/api/groups/join", GroupJoin);
openapi.delete("/api/groups/:id", GroupDelete);
openapi.put("/api/groups/:id", GroupUpdate);
openapi.get("/api/groups/balances", GroupBalances);
openapi.post("/api/groups/:group_id/settle", GroupSettle);

// ── Categories ──
openapi.get("/api/categories", CategoryList);
openapi.post("/api/categories", CategoryCreate);
openapi.put("/api/categories/:id", CategoryUpdate);
openapi.delete("/api/categories/:id", CategoryDelete);

// ── Tags ──
openapi.get("/api/tags", TagList);
openapi.post("/api/tags", TagCreate);
openapi.delete("/api/tags/:id", TagDelete);

// ── Accounts ──
openapi.get("/api/accounts", AccountList);
openapi.post("/api/accounts", AccountCreate);
openapi.put("/api/accounts/:id", AccountUpdate);
openapi.delete("/api/accounts/:id", AccountDelete);

// ── User Setup ──
openapi.post("/api/user/setup", UserSetup);

// ── API Keys ──
openapi.get("/api/keys", ApiKeyFetch);
openapi.post("/api/keys", ApiKeyGenerate);

// ── App Config ──
openapi.get("/api/config", AppConfigFetch);

// Export the Hono app with cron trigger handler
export default {
	fetch: app.fetch.bind(app),
	scheduled,
};
