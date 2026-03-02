DROP TABLE IF EXISTS expenses;

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    type TEXT CHECK(type IN ('expense', 'income')) NOT NULL,
    account TEXT NOT NULL,
    user_id TEXT NOT NULL,
    tag TEXT,
    date TEXT NOT NULL, -- Stored as YYYY-MM-DD string
    recurring_rule_id INTEGER, -- FK to recurring_rules (nullable)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recurring_rules (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      TEXT NOT NULL,
    title        TEXT NOT NULL,
    amount       REAL NOT NULL,
    category     TEXT NOT NULL,
    type         TEXT CHECK(type IN ('expense','income')) NOT NULL DEFAULT 'expense',
    account      TEXT NOT NULL,
    tag          TEXT,
    frequency    TEXT CHECK(frequency IN ('daily','weekly','monthly','yearly')) NOT NULL,
    day_of_month INTEGER,      -- 1-28, only for monthly frequency
    next_run     TEXT NOT NULL, -- YYYY-MM-DD, date of next execution
    is_active    INTEGER DEFAULT 1,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
