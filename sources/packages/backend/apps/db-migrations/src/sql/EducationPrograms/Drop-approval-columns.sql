-- Drop submitted_on
ALTER TABLE
  sims.education_programs DROP COLUMN IF EXISTS submitted_on;

-- Drop submitted_by
ALTER TABLE
  sims.education_programs DROP COLUMN IF EXISTS submitted_by;

-- Drop status_updated_on
ALTER TABLE
  sims.education_programs DROP COLUMN IF EXISTS status_updated_on;

-- Drop status_updated_by
ALTER TABLE
  sims.education_programs DROP COLUMN IF EXISTS status_updated_by;

-- Drop effective_end_date
ALTER TABLE
  sims.education_programs DROP COLUMN IF EXISTS effective_end_date;

-- Drop program_note_id
ALTER TABLE
  sims.education_programs DROP COLUMN IF EXISTS program_note;