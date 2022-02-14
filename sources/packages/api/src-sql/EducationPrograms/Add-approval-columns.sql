-- Add submitted_on to education_programs table.
ALTER TABLE
  sims.education_programs
ADD
  COLUMN IF NOT EXISTS submitted_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

COMMENT ON COLUMN sims.education_programs.submitted_on IS 'Education program submitted date by the institution user.';

-- Add status_updated_on to education_programs table.
ALTER TABLE
  sims.education_programs
ADD
  COLUMN IF NOT EXISTS status_updated_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

COMMENT ON COLUMN sims.education_programs.status_updated_on IS 'Education program status updated on by institution or minsitry  user';

-- Add effective_end_date to education_programs table.
ALTER TABLE
  sims.education_programs
ADD
  COLUMN IF NOT EXISTS effective_end_date DATE;

COMMENT ON COLUMN sims.education_programs.effective_end_date IS 'Effective End date added by minsitry user, when a minsitry user approve a pending program.';

-- Add program_note to education_programs table.
ALTER TABLE
  sims.education_programs
ADD
  COLUMN IF NOT EXISTS program_note INT REFERENCES sims.notes(id);

COMMENT ON COLUMN sims.education_programs.program_note IS 'Education program note added by minsitry user, when a minsitry user approve a pending program.';

-- Add status_updated_by to education_programs table.
ALTER TABLE
  sims.education_programs
ADD
  COLUMN IF NOT EXISTS status_updated_by INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
SET
  NULL;

COMMENT ON COLUMN sims.education_programs.status_updated_by IS 'Education program status updated by either institution or minsitry user.';

-- Add submitted_by to education_programs table.
ALTER TABLE
  sims.education_programs
ADD
  COLUMN IF NOT EXISTS submitted_by INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
SET
  NULL;

COMMENT ON COLUMN sims.education_programs.submitted_by IS 'Education program submitted by institution user.';