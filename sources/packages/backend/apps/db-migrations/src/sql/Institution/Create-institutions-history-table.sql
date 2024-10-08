-- Table to keep historical data.
-- Columns history_timestamp and history_operation should be default columns for all the history tables.
-- Columns other than the above-mentioned should reflect the columns from the original table without constraints and relationships.
-- The order of the columns below follow the exact same order from the existing table.
CREATE TABLE sims.institutions_history AS
SELECT
  CURRENT_TIMESTAMP AS history_timestamp,
  '' :: varchar(50) AS history_operation,
  *
FROM
  sims.institutions
WHERE
  false;

-- Set history columns as NOT NULL.
ALTER TABLE
  sims.institutions_history
ALTER COLUMN
  history_timestamp
SET
  NOT NULL,
ALTER COLUMN
  history_operation
SET
  NOT NULL;

CREATE INDEX institutions_history_timestamp ON sims.institutions_history(history_timestamp);

COMMENT ON INDEX sims.institutions_history_timestamp IS 'Historical data index to improve point-in-time data retrieval.';

COMMENT ON TABLE sims.institutions_history IS 'Historical data generated after records are inserted or updated.';

COMMENT ON COLUMN sims.institutions_history.history_timestamp IS 'Date and time the history record was inserted.';

COMMENT ON COLUMN sims.institutions_history.history_operation IS 'Database operation that generates the history.';

COMMENT ON COLUMN sims.institutions_history.id IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institutions_history.business_guid IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institutions_history.legal_operating_name IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institutions_history.operating_name IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institutions_history.primary_phone IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institutions_history.primary_email IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institutions_history.website IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institutions_history.regulating_body IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institutions_history.established_date IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institutions_history.primary_contact IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institutions_history.institution_address IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institutions_history.created_at IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institutions_history.updated_at IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institutions_history.creator IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institutions_history.modifier IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institutions_history.institution_type_id IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institutions_history.other_regulating_body IS 'Historical data from the original table. See original table comments for details.';

-- Creates the trigger to have the table populated using the shared create_history_entry function.
CREATE TRIGGER institutions_history_trigger
AFTER
INSERT
  OR
UPDATE
  ON sims.institutions FOR EACH ROW EXECUTE PROCEDURE sims.create_history_entry();

COMMENT ON TRIGGER institutions_history_trigger ON sims.institutions IS 'Creates historical data for the institutions table.';