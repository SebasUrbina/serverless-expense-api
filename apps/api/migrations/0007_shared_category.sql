-- Members' shares of expenses paid by someone else count under a category of
-- the same name, or under "Compartidos" when they have none.
INSERT OR IGNORE INTO categories (user_id, name, type, icon)
SELECT DISTINCT user_id, 'Compartidos', 'expense', '👥' FROM shared_group_members;

-- Personal summaries look up the user's groups on every request.
CREATE INDEX IF NOT EXISTS idx_shared_group_members_user
    ON shared_group_members (user_id, group_id);
