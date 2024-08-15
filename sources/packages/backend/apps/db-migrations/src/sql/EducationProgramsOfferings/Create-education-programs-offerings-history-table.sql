-- Table to keep historical data.
-- Columns history_timestamp and history_operation should be default columns for all the history tables.
-- Columns other than the above-mentioned should reflect the columns from the original table without constraints and relationships.
-- The order of the columns below follow the exact same order from the existing table.
CREATE TABLE sims.education_programs_offerings_history AS
SELECT
  CURRENT_TIMESTAMP AS history_timestamp,
  '' :: varchar(50) AS history_operation,
  *
FROM
  sims.education_programs_offerings
WHERE
  false;

-- Set history columns as NOT NULL.
ALTER TABLE
  sims.education_programs_offerings_history
ALTER COLUMN
  history_timestamp
SET
  NOT NULL,
ALTER COLUMN
  history_operation
SET
  NOT NULL;

CREATE INDEX education_programs_offerings_history_timestamp ON sims.education_programs_offerings_history(history_timestamp);

COMMENT ON INDEX sims.education_programs_offerings_history_timestamp IS 'Historical data index to improve point-in-time data retrieval.';

COMMENT ON TABLE sims.education_programs_offerings_history IS 'Historical data generated after records are inserted or updated.';

COMMENT ON COLUMN sims.education_programs_offerings_history.history_timestamp IS 'Date and time the history record was inserted.';

COMMENT ON COLUMN sims.education_programs_offerings_history.history_operation IS 'Database operation that generates the history.';

COMMENT ON COLUMN sims.education_programs_offerings_history.id IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.offering_name IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.study_start_date IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.study_end_date IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.actual_tuition_costs IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.program_related_costs IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.mandatory_fees IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.exceptional_expenses IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.offering_delivered IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.lacks_study_breaks IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.program_id IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.location_id IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.created_at IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.updated_at IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.creator IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.modifier IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.offering_type IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.offering_intensity IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.year_of_study IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.has_offering_wil_component IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.offering_wil_type IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.study_breaks IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.offering_declaration IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.offering_status IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.assessed_by IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.assessed_date IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.submitted_date IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.offering_note IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.course_load IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.parent_offering_id IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_offerings_history.preceding_offering_id IS 'Historical data from the original table. See original table comments for details.';

-- Creates the trigger to have the table populated using the shared create_history_entry function.
CREATE TRIGGER education_programs_offerings_history_trigger
AFTER
INSERT
  OR
UPDATE
  ON sims.education_programs_offerings FOR EACH ROW EXECUTE PROCEDURE sims.create_history_entry();

COMMENT ON TRIGGER education_programs_offerings_history_trigger ON sims.education_programs_offerings IS 'Creates historical data for the education_programs_offerings table.';