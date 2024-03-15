ALTER TABLE
  sims.education_programs
ADD
  COLUMN is_active BOOLEAN DEFAULT TRUE,
ADD
  COLUMN is_active_updated_by INT NULL REFERENCES sims.users(id),
ADD
  COLUMN is_active_updated_on TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN sims.education_programs.is_active IS 'Indicates if an education program is active and should be available for student and for institutions, for instance, while completing PIRs.';

COMMENT ON COLUMN sims.education_programs.is_active_updated_by IS 'Last user id that updated the is_active column value. If null, the is_active was never changed since its creation.';

COMMENT ON COLUMN sims.education_programs.is_active_updated_on IS 'Last date and time the is_active column value was updated. If null, the is_active was never changed since its creation.';