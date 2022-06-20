-- Remove columns from CRA SIN validation schema.
ALTER TABLE
  sims.sin_validations DROP COLUMN IF EXISTS request_status_code,
  DROP COLUMN IF EXISTS match_status_code,
  DROP COLUMN IF EXISTS sin_match_status_code,
  DROP COLUMN IF EXISTS surname_match_status_code,
  DROP COLUMN IF EXISTS given_name_match_status_code,
  DROP COLUMN IF EXISTS dob_match_status_code;

-- Adding SIN column, previously it was just on the student table and from now on
-- it will be the only this the sims.sin_validations.
ALTER TABLE
  sims.sin_validations
ADD
  -- This will be changed to NOT NULL in the end of the script.
  COLUMN IF NOT EXISTS sin VARCHAR(9),
ADD
  COLUMN IF NOT EXISTS temporary_sin BOOLEAN NOT NULL GENERATED ALWAYS AS (
    CASE
      WHEN sin LIKE '9%' THEN TRUE
      ELSE false
    END
  ) STORED;

-- Adding a missing column for history (first name, last name and others are already present).
ALTER TABLE
  sims.sin_validations
ADD
  COLUMN IF NOT EXISTS gender_sent VARCHAR(10);

-- New columns added based on the new ESDC schema.
ALTER TABLE
  sims.sin_validations
ADD
  COLUMN IF NOT EXISTS sin_status CHAR(1),
ADD
  COLUMN IF NOT EXISTS valid_sin_check CHAR(1),
ADD
  COLUMN IF NOT EXISTS valid_birthdate_check CHAR(1),
ADD
  COLUMN IF NOT EXISTS valid_first_name_check CHAR(1),
ADD
  COLUMN IF NOT EXISTS valid_last_name_check CHAR(1),
ADD
  COLUMN IF NOT EXISTS valid_gender_check CHAR(1),
ADD
  COLUMN IF NOT EXISTS sin_expire_date DATE;

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

-- Copy SIN from student to the new sin column on sims.sin_validations.
UPDATE
  sims.sin_validations
SET
  sin = CAST(sims.students.sin AS VARCHAR(9))
FROM
  sims.students
WHERE
  students.sin_validation_id = sims.sin_validations.id;

-- Remove sin_validations that were not update from students.
DELETE FROM
  sims.sin_validations
WHERE
  sin IS NULL;

-- Adjust new sin column to be NOT NULL.
ALTER TABLE
  sims.sin_validations
ALTER COLUMN
  sin
SET
  NOT NULL;

-- ## Comments
COMMENT ON COLUMN sims.sin_validations.sin IS 'Social insurance number.';

COMMENT ON COLUMN sims.sin_validations.gender_sent IS 'The user gender to match with the SIN record.';

COMMENT ON COLUMN sims.sin_validations.sin_status IS 'Overall SIN validation status (e.g. 1-Passed, 2-Under Review, etc.) returned on the ESDC response.';

COMMENT ON COLUMN sims.sin_validations.valid_sin_check IS 'Individual status of the SIN validation (Y/N) returned on the ESDC response.';

COMMENT ON COLUMN sims.sin_validations.valid_birthdate_check IS 'Individual status of birthdate validation (Y/N) returned on the ESDC response.';

COMMENT ON COLUMN sims.sin_validations.valid_first_name_check IS 'Individual status of the first name validation (Y/N) returned on the ESDC response.';

COMMENT ON COLUMN sims.sin_validations.valid_last_name_check IS 'Individual status of the last name validation (Y/N) returned on the ESDC response.';

COMMENT ON COLUMN sims.sin_validations.valid_gender_check IS 'Individual status of the gender validation (Y/N) returned on the ESDC response.';

COMMENT ON COLUMN sims.sin_validations.sin_expire_date IS 'Expiration date for a temporary SIN.';

COMMENT ON COLUMN sims.sin_validations.temporary_sin IS 'Defines if the SIN is temporary.';

COMMENT ON COLUMN sims.sin_validations.sin_edited_by IS 'User that manually edited the SIN.';

COMMENT ON COLUMN sims.sin_validations.sin_edited_date IS 'Date and time that a user manually edited the SIN.';

COMMENT ON COLUMN sims.sin_validations.sin_edited_note_id IS 'Note that explains why the SIN was manually edited.';

COMMENT ON COLUMN sims.sin_validations.expired_date_edited_by IS 'User that manually edited the SIN expiry date.';

COMMENT ON COLUMN sims.sin_validations.expired_date_edited_date IS 'Date and time that a user manually edited the SIN expiry date.';

COMMENT ON COLUMN sims.sin_validations.expired_date_edited_note_id IS 'Note that explains why the SIN expiry date was manually edited.';