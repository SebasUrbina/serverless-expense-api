DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS transaction_splits;
DROP TABLE IF EXISTS shared_group_members;
DROP TABLE IF EXISTS shared_groups;
DROP TABLE IF EXISTS transaction_tags;
DROP TABLE IF EXISTS recurring_rule_tags;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS recurring_rules;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS accounts;

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('expense', 'income')) NOT NULL,
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name, type)
);

CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('checking', 'savings', 'credit', 'cash')) NOT NULL,
    balance REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    category_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('expense', 'income')) NOT NULL,
    account_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    recurring_rule_id INTEGER, -- FK to recurring_rules (nullable)
    is_shared INTEGER DEFAULT 0,
    group_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES shared_groups(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transaction_tags (
    transaction_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (transaction_id, tag_id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
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
    category_id  INTEGER NOT NULL,
    type         TEXT CHECK(type IN ('expense','income')) NOT NULL DEFAULT 'expense',
    account_id   INTEGER NOT NULL,
    frequency    TEXT CHECK(frequency IN ('daily','weekly','monthly','yearly')) NOT NULL,
    day_of_month INTEGER,      -- 1-28, only for monthly frequency
    next_run     DATE NOT NULL, -- date of next execution
    end_date     DATE,          -- optional date when the rule stops
    is_active    INTEGER DEFAULT 1,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recurring_rule_tags (
    recurring_rule_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (recurring_rule_id, tag_id),
    FOREIGN KEY (recurring_rule_id) REFERENCES recurring_rules(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shared_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_by TEXT NOT NULL,
    invite_code TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shared_group_members (
    group_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    nickname TEXT NOT NULL DEFAULT 'Miembro',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES shared_groups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transaction_splits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    percentage INTEGER NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);
