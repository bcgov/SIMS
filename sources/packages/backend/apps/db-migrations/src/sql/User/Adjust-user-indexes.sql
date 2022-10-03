-- Drop existent indexes
DROP INDEX IF EXISTS sims.idx_users_id_20210115_5_00;

DROP INDEX IF EXISTS sims.idx_users_name_20210115_5_01;

DROP INDEX IF EXISTS sims.idx_users_display_name_20210127_14_02;

-- Create new index
CREATE INDEX IF NOT EXISTS users_lower_last_name ON sims.users(lower(last_name));