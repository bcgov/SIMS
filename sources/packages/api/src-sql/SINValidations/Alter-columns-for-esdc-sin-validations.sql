-- Remove columns from CRA SIN validation schema.
ALTER TABLE
  sims.sin_validations DROP COLUMN IF EXISTS given_name_sent,
  DROP COLUMN IF EXISTS surname_sent,
  DROP COLUMN IF EXISTS dob_sent,
  DROP COLUMN IF EXISTS request_status_code,
  DROP COLUMN IF EXISTS match_status_code,
  DROP COLUMN IF EXISTS sin_match_status_code,
  DROP COLUMN IF EXISTS surname_match_status_code,
  DROP COLUMN IF EXISTS given_name_match_status_code,
  DROP COLUMN IF EXISTS dob_match_status_code;

-- New columns added based on the new ESDC schema.
ALTER TABLE
  sims.sin_validations
ADD
  COLUMN IF NOT EXISTS sin_status CHAR(1),
ADD
  COLUMN IF NOT EXISTS valid_sin CHAR(1),
ADD
  COLUMN IF NOT EXISTS valid_birthdate CHAR(1),
ADD
  COLUMN IF NOT EXISTS valid_first_name CHAR(1),
ADD
  COLUMN IF NOT EXISTS valid_last_name CHAR(1),
ADD
  COLUMN IF NOT EXISTS valid_gender_name CHAR(1),
ADD
  COLUMN IF NOT EXISTS sin_expire_date DATE,
ADD
  COLUMN IF NOT EXISTS temporary_sin BOOLEAN NOT NULL DEFAULT false;

-- New columns added to allow audit of manual SIN manipulation.
ALTER TABLE
  sims.sin_validations
ADD
  COLUMN IF NOT EXISTS sin_edited_by INT REFERENCES sims.users (id) ON DELETE
SET
  NULL,
ADD
  COLUMN IF NOT EXISTS sin_edited_date TIMESTAMP WITH TIME ZONE,
ADD
  COLUMN IF NOT EXISTS sin_edited_note_id INT REFERENCES sims.notes (id) ON DELETE
SET
  NULL,
ADD
  COLUMN IF NOT EXISTS expired_date_edited_by INT REFERENCES sims.users (id) ON DELETE
SET
  NULL,
ADD
  COLUMN IF NOT EXISTS expired_date_edited_date TIMESTAMP WITH TIME ZONE,
ADD
  COLUMN IF NOT EXISTS expired_date_edited_note_id INT REFERENCES sims.notes (id) ON DELETE
SET
  NULL;

-- ## Comments
COMMENT ON COLUMN sims.sin_validations.sin_status IS 'Overall SIN validation status (e.g. 1-Passed, 2-Under Review, etc.).';

COMMENT ON COLUMN sims.sin_validations.valid_sin IS 'Individual status of the SIN validation (Y/N).';

COMMENT ON COLUMN sims.sin_validations.valid_birthdate IS 'Individual status of birthdate validation (Y/N).';

COMMENT ON COLUMN sims.sin_validations.valid_first_name IS 'Individual status of the first name validation (Y/N).';

COMMENT ON COLUMN sims.sin_validations.valid_last_name IS 'Individual status of the last name validation (Y/N).';

COMMENT ON COLUMN sims.sin_validations.valid_gender_name IS 'Individual status of the gender validation (Y/N).';

COMMENT ON COLUMN sims.sin_validations.sin_edited_by IS 'User that manually edited the SIN.';

COMMENT ON COLUMN sims.sin_validations.sin_edited_date IS 'Date and time that a user manually edited the SIN.';

COMMENT ON COLUMN sims.sin_validations.sin_edited_note_id IS 'Note that explains why the SIN was manually edited.';

COMMENT ON COLUMN sims.sin_validations.expired_date_edited_by IS 'User that manually edited the SIN expiry date.';

COMMENT ON COLUMN sims.sin_validations.expired_date_edited_date IS 'Date and time that a user manually edited the SIN expiry date.';

COMMENT ON COLUMN sims.sin_validations.expired_date_edited_note_id IS 'Note that explains why the SIN expiry date was manually edited.';