-- Indexes for transaction searches, filtering and ordering
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions (user_id, date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions (category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions (account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_group ON transactions (group_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (type);

-- Indexes for shared transaction splits
CREATE INDEX IF NOT EXISTS idx_transaction_splits_user ON transaction_splits (user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_splits_tx ON transaction_splits (transaction_id);

-- Index for transaction tags reverse lookups
CREATE INDEX IF NOT EXISTS idx_transaction_tags_tag_id ON transaction_tags (tag_id);

-- Indexes for static entity queries by user
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories (user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user ON tags (user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_rules_user ON recurring_rules (user_id);
