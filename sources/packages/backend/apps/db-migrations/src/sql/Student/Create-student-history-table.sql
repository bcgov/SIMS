-- Table to keep historical data.
-- Columns history_timestamp and history_operation should be default columns for all the history tables.
-- Columns other than the above-mentioned should reflect the columns from the original table without constraints and relationships.
-- The order of the columns below follow the exact same order from the existing table.
CREATE TABLE sims.students_history (
  history_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  history_operation varchar(20) NOT NULL,
  id INT,
  contact_info JSONB,
  user_id INT,
  created_at TIMESTAMP WITHOUT TIME ZONE,
  updated_at TIMESTAMP WITHOUT TIME ZONE,
  creator INT,
  modifier INT,
  birth_date date,
  gender varchar(50),
  pd_date_sent TIMESTAMP WITHOUT TIME ZONE,
  pd_date_update TIMESTAMP WITHOUT TIME ZONE,
  sin_validation_id INT,
  sin_consent BOOLEAN,
  disability_status sims.disability_status,
  disability_status_effective_date TIMESTAMP WITH TIME ZONE,
  cas_supplier_id INT
);

CREATE INDEX students_history_timestamp ON sims.students_history(history_timestamp);

COMMENT ON INDEX sims.students_history_timestamp IS 'Historical data index to improve point-in-time data retrieval.';

COMMENT ON TABLE sims.students_history IS 'Historical data generated after records are inserted or updated.';

COMMENT ON COLUMN sims.students_history.history_timestamp IS 'Date and time the history record was inserted.';

COMMENT ON COLUMN sims.students_history.history_operation IS 'Database operation that generates the history.';

COMMENT ON COLUMN sims.students_history.id IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.students_history.contact_info IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.students_history.user_id IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.students_history.created_at IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.students_history.updated_at IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.students_history.creator IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.students_history.modifier IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.students_history.birth_date IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.students_history.gender IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.students_history.pd_date_sent IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.students_history.pd_date_update IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.students_history.sin_validation_id IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.students_history.sin_consent IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.students_history.disability_status IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.students_history.disability_status_effective_date IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.students_history.cas_supplier_id IS 'Historical data from the original table. See original table comments for details.';

-- Creates the trigger to have the table populated using the shared create_history_entry function.
CREATE TRIGGER students_history_trigger
AFTER
INSERT
  OR
UPDATE
  ON sims.students FOR EACH ROW EXECUTE PROCEDURE sims.create_history_entry();

COMMENT ON TRIGGER students_history_trigger ON sims.students IS 'Creates historical data for the students table.';