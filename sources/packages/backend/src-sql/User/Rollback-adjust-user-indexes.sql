-- Drop previously added indexes
DROP INDEX IF EXISTS sims.users_lower_first_name_lower_last_name;

-- Recreate the indexes as they were before
CREATE INDEX IF NOT EXISTS idx_users_id_20210115_5_00 ON sims.users(id);

CREATE INDEX IF NOT EXISTS idx_users_name_20210115_5_01 ON sims.users(user_name);

CREATE INDEX IF NOT EXISTS idx_users_display_name_20210127_14_02 ON sims.users(first_name, last_name);