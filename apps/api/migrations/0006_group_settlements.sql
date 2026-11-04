-- Payments between group members. They even out the shared balance without
-- creating expenses or income, so budgets and categories are not affected.
CREATE TABLE IF NOT EXISTS group_settlements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    from_user_id TEXT NOT NULL,
    to_user_id TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (from_user_id <> to_user_id),
    FOREIGN KEY (group_id) REFERENCES shared_groups(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_group_settlements_group_date
    ON group_settlements (group_id, date);
