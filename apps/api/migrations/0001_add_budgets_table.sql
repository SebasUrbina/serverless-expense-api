CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    month TEXT NOT NULL,
    scope TEXT CHECK(scope IN ('general', 'category')) NOT NULL DEFAULT 'general',
    category_id INTEGER,
    amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_general ON budgets(user_id, month) WHERE scope = 'general';
CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_category ON budgets(user_id, month, category_id) WHERE scope = 'category';
