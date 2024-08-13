-- Table to keep historical data.
-- Columns history_timestamp and history_operation should be default columns for all the history tables.
-- Columns other than the above-mentioned should reflect the columns from the original table without constraints and relationships.
-- The order of the columns below follow the exact same order from the existing table.
CREATE TABLE sims.education_programs_history (
  history_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  history_operation VARCHAR(20) NOT NULL,
  id INT,
  program_name VARCHAR(300),
  program_description VARCHAR(500),
  credential_type VARCHAR(50),
  cip_code VARCHAR(50),
  noc_code VARCHAR(50),
  sabc_code VARCHAR(50),
  regulatory_body VARCHAR(100),
  delivered_on_site BOOLEAN,
  delivered_online BOOLEAN,
  delivered_online_also_onsite VARCHAR(50),
  same_online_credits_earned VARCHAR(50),
  earn_academic_credits_other_institution VARCHAR(50),
  course_load_calculation VARCHAR(50),
  completion_years VARCHAR(50),
  esl_eligibility VARCHAR(50),
  has_joint_institution VARCHAR(50),
  has_joint_designated_institution VARCHAR(50),
  program_status sims.program_status,
  institution_id INT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  creator INT,
  modifier INT,
  program_intensity sims.program_intensity,
  institution_program_code VARCHAR(50),
  min_hours_week VARCHAR(50),
  is_aviation_program VARCHAR(50),
  min_hours_week_avi VARCHAR(50),
  has_minimum_age BOOLEAN,
  min_high_school BOOLEAN,
  requirements_by_institution BOOLEAN,
  requirements_by_bcita BOOLEAN,
  has_wil_component VARCHAR(50),
  is_wil_approved VARCHAR(50),
  wil_program_eligibility VARCHAR(50),
  has_travel VARCHAR(50),
  travel_program_eligibility VARCHAR(50),
  has_intl_exchange VARCHAR(50),
  intl_exchange_program_eligibility VARCHAR(50),
  program_declaration BOOLEAN,
  submitted_date TIMESTAMP WITH TIME ZONE,
  assessed_date TIMESTAMP WITH TIME ZONE,
  effective_end_date DATE,
  program_note INT,
  assessed_by INT,
  submitted_by INT,
  field_of_study_code INT,
  other_regulatory_body VARCHAR(100),
  none_of_entrance_requirements BOOLEAN,
  is_active BOOLEAN,
  is_active_updated_by INT,
  is_active_updated_on TIMESTAMP WITH TIME ZONE
);

CREATE INDEX education_programs_history_timestamp ON sims.education_programs_history(history_timestamp);

COMMENT ON INDEX sims.education_programs_history_timestamp IS 'Historical data index to improve point-in-time data retrieval.';

COMMENT ON TABLE sims.education_programs_history IS 'Historical data generated after records are inserted or updated.';

COMMENT ON COLUMN sims.education_programs_history.history_timestamp IS 'Date and time the history record was inserted.';

COMMENT ON COLUMN sims.education_programs_history.history_operation IS 'Database operation that generates the history.';

COMMENT ON COLUMN sims.education_programs_history.id IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.program_name IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.program_description IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.credential_type IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.cip_code IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.noc_code IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.sabc_code IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.regulatory_body IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.delivered_on_site IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.delivered_online IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.delivered_online_also_onsite IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.same_online_credits_earned IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.earn_academic_credits_other_institution IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.course_load_calculation IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.completion_years IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.esl_eligibility IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.has_joint_institution IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.has_joint_designated_institution IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.program_status IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.institution_id IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.created_at IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.updated_at IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.creator IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.modifier IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.program_intensity IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.institution_program_code IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.min_hours_week IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.is_aviation_program IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.min_hours_week_avi IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.has_minimum_age IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.min_high_school IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.requirements_by_institution IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.requirements_by_bcita IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.has_wil_component IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.is_wil_approved IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.wil_program_eligibility IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.has_travel IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.travel_program_eligibility IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.has_intl_exchange IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.intl_exchange_program_eligibility IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.program_declaration IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.submitted_date IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.assessed_date IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.effective_end_date IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.program_note IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.assessed_by IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.submitted_by IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.field_of_study_code IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.other_regulatory_body IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.none_of_entrance_requirements IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.is_active IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.is_active_updated_by IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.is_active_updated_on IS 'Historical data from the original table. See original table comments for details.';

-- Creates the trigger to have the table populated using the shared create_history_entry function.
CREATE TRIGGER education_programs_history_trigger
AFTER
INSERT
  OR
UPDATE
  ON sims.education_programs FOR EACH ROW EXECUTE PROCEDURE sims.create_history_entry();

COMMENT ON TRIGGER education_programs_history_trigger ON sims.education_programs IS 'Creates historical data for the education_programs table.';