-- Table to keep historical data.
-- Columns history_timestamp and history_operation should be default columns for all the history tables.
-- Columns other than the above-mentioned should reflect the columns from the original table without constraints and relationships.
-- The order of the columns below follow the exact same order from the existing table.
CREATE TABLE sims.education_programs_offerings_history (
  history_timestamp TIMESTAMP WITH TIME ZONE,
  history_operation VARCHAR(20),
  id INT,
  offering_name VARCHAR(300),
  study_start_date DATE,
  study_end_date DATE,
  actual_tuition_costs INT,
  program_related_costs INT,
  mandatory_fees INT,
  exceptional_expenses INT,
  offering_delivered VARCHAR(50),
  lacks_study_breaks BOOLEAN,
  program_id INT,
  location_id INT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  creator INT,
  modifier INT,
  offering_type sims.offering_types,
  offering_intensity sims.offering_intensity,
  year_of_study INT,
  has_offering_wil_component VARCHAR(50),
  offering_wil_type VARCHAR(50),
  study_breaks JSONB,
  offering_declaration BOOLEAN,
  offering_status sims.offering_status,
  assessed_by INT,
  assessed_date TIMESTAMP WITH TIME ZONE,
  submitted_date TIMESTAMP WITH TIME ZONE,
  offering_note INT,
  course_load SMALLINT,
  parent_offering_id INT,
  preceding_offering_id INT
);

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