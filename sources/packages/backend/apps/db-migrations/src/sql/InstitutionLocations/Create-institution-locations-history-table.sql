-- Table to keep historical data.
-- Columns history_timestamp and history_operation should be default columns for all the history tables.
-- Columns other than the above-mentioned should reflect the columns from the original table without constraints and relationships.
-- The order of the columns below follow the exact same order from the existing table.
CREATE TABLE sims.institution_locations_history AS
SELECT
  CURRENT_TIMESTAMP AS history_date,
  '' :: varchar(50) AS history_operation,
  *
FROM
  sims.institution_locations
WHERE
  false;

CREATE INDEX institution_locations_history_timestamp ON sims.institution_locations_history(history_timestamp);

COMMENT ON INDEX sims.institution_locations_history_timestamp IS 'Historical data index to improve point-in-time data retrieval.';

COMMENT ON TABLE sims.institution_locations_history IS 'Historical data generated after records are inserted or updated.';

COMMENT ON COLUMN sims.institution_locations_history.history_timestamp IS 'Date and time the history record was inserted.';

COMMENT ON COLUMN sims.institution_locations_history.history_operation IS 'Database operation that generates the history.';

COMMENT ON COLUMN sims.institution_locations_history.id IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institution_locations_history.name IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institution_locations_history.info IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institution_locations_history.institution_id IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institution_locations_history.created_at IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institution_locations_history.updated_at IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institution_locations_history.creator IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institution_locations_history.modifier IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institution_locations_history.institution_code IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institution_locations_history.primary_contact IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institution_locations_history.has_integration IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institution_locations_history.integration_contacts IS 'Historical data from the original table. See original table comments for details.';

-- Creates the trigger to have the table populated using the shared create_history_entry function.
CREATE TRIGGER institution_locations_history_trigger
AFTER
INSERT
  OR
UPDATE
  ON sims.institution_locations FOR EACH ROW EXECUTE PROCEDURE sims.create_history_entry();

COMMENT ON TRIGGER institution_locations_history_trigger ON sims.institution_locations IS 'Creates historical data for the institution_locations table.';