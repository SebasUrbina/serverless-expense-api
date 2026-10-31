-- Group balances filter by group and month; (group_id, date) also serves group_id-only lookups.
CREATE INDEX IF NOT EXISTS idx_transactions_group_date ON transactions (group_id, date);
DROP INDEX IF EXISTS idx_transactions_group;
