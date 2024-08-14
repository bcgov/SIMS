-- Table to keep historical data.
-- Columns history_timestamp and history_operation should be default columns for all the history tables.
-- Columns other than the above-mentioned should reflect the columns from the original table without constraints and relationships.
-- The order of the columns below follow the exact same order from the existing table.
CREATE TABLE sims.supporting_users_history AS
SELECT
  CURRENT_TIMESTAMP AS history_timestamp,
  '' :: varchar(50) AS history_operation,
  *
FROM
  sims.supporting_users
WHERE
  false;

-- Set history columns as NOT NULL.
ALTER TABLE
  sims.supporting_users_history
ALTER COLUMN
  history_timestamp
SET
  NOT NULL,
ALTER COLUMN
  history_operation
SET
  NOT NULL;

CREATE INDEX supporting_users_history_timestamp ON sims.supporting_users_history(history_timestamp);

COMMENT ON INDEX sims.supporting_users_history_timestamp IS 'Historical data index to improve point-in-time data retrieval.';

COMMENT ON TABLE sims.supporting_users_history IS 'Historical data generated after records are inserted or updated.';

COMMENT ON COLUMN sims.supporting_users_history.history_timestamp IS 'Date and time the history record was inserted.';

COMMENT ON COLUMN sims.supporting_users_history.history_operation IS 'Database operation that generates the history.';

COMMENT ON COLUMN sims.supporting_users_history.id IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.supporting_users_history.contact_info IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.supporting_users_history.sin IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.supporting_users_history.birth_date IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.supporting_users_history.supporting_data IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.supporting_users_history.supporting_user_type IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.supporting_users_history.user_id IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.supporting_users_history.application_id IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.supporting_users_history.created_at IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.supporting_users_history.updated_at IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.supporting_users_history.creator IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.supporting_users_history.modifier IS 'Historical data from the original table. See original table comments for details.';

-- Creates the trigger to have the table populated using the shared create_history_entry function.
CREATE TRIGGER supporting_users_history_trigger
AFTER
INSERT
  OR
UPDATE
  ON sims.supporting_users FOR EACH ROW EXECUTE PROCEDURE sims.create_history_entry();

COMMENT ON TRIGGER supporting_users_history_trigger ON sims.supporting_users IS 'Creates historical data for the supporting_users table.';