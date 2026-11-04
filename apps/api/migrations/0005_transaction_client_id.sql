-- Clients send a unique id per new movement so a retried request (e.g. an offline
-- create whose response was lost) returns the original instead of a duplicate.
-- Only the first row of an installment series carries it.
ALTER TABLE transactions ADD COLUMN client_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_user_client
  ON transactions (user_id, client_id) WHERE client_id IS NOT NULL;
