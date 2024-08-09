-- Table to keep historical data.
-- Columns history_timestamp and history_operation should be default columns for all the history tables.
-- Columns other than the above-mentioned should reflect the columns from the original table without constraints and relationships.
-- The order of the columns below follow the exact same order from the existing table.
CREATE TABLE sims.users_history (
  history_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  history_operation varchar(20) NOT NULL,
  id INT,
  user_name VARCHAR(300),
  email VARCHAR(300),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  is_active bool,
  creator INT,
  modifier INT,
  identity_provider_type sims."identity_provider_types"
);

CREATE INDEX users_history_timestamp ON sims.users_history(history_timestamp);

COMMENT ON INDEX sims.users_history_timestamp IS 'Historical data index to improve point-in-time data retrieval.';

COMMENT ON TABLE sims.users_history IS 'Historical data generated after records are inserted or updated.';

COMMENT ON COLUMN sims.users_history.history_timestamp IS 'Date and time the history record was inserted.';

COMMENT ON COLUMN sims.users_history.history_operation IS 'Database operation that generates the history.';

COMMENT ON COLUMN sims.users_history.id IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.users_history.user_name IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.users_history.email IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.users_history.first_name IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.users_history.last_name IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.users_history.created_at IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.users_history.updated_at IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.users_history.is_active IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.users_history.creator IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.users_history.modifier IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.users_history.identity_provider_type IS 'Historical data from the original table. See original table comments for details.';

-- Creates the trigger to have the table populated using the shared create_history_entry function.
CREATE TRIGGER users_history_trigger
AFTER
INSERT
  OR
UPDATE
  ON sims.users FOR EACH ROW EXECUTE PROCEDURE sims.create_history_entry();

COMMENT ON TRIGGER users_history_trigger ON sims.users IS 'Creates historical data for the users table.';