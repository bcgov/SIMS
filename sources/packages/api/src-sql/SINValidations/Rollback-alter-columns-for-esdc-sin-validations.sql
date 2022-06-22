-- Remove columns from ESDC SIN validation schema.
ALTER TABLE
  sims.sin_validations DROP COLUMN IF EXISTS sin,
  DROP COLUMN IF EXISTS gender_sent,
  DROP COLUMN IF EXISTS sin_status,
  DROP COLUMN IF EXISTS valid_sin_check,
  DROP COLUMN IF EXISTS valid_birthdate_check,
  DROP COLUMN IF EXISTS valid_first_name_check,
  DROP COLUMN IF EXISTS valid_last_name_check,
  DROP COLUMN IF EXISTS valid_gender_check,
  DROP COLUMN IF EXISTS sin_expire_date,
  DROP COLUMN IF EXISTS temporary_sin,
  DROP COLUMN IF EXISTS sin_edited_by,
  DROP COLUMN IF EXISTS sin_edited_date,
  DROP COLUMN IF EXISTS sin_edited_note_id,
  DROP COLUMN IF EXISTS expired_date_edited_by,
  DROP COLUMN IF EXISTS expired_date_edited_date,
  DROP COLUMN IF EXISTS expired_date_edited_note_id;

-- Add columns for the CRA SIN validation.
ALTER TABLE
  sims.sin_validations
ADD
  COLUMN IF NOT EXISTS request_status_code CHAR(2),
ADD
  COLUMN IF NOT EXISTS match_status_code CHAR(2),
ADD
  COLUMN IF NOT EXISTS sin_match_status_code CHAR(2),
ADD
  COLUMN IF NOT EXISTS surname_match_status_code CHAR(2),
ADD
  COLUMN IF NOT EXISTS given_name_match_status_code CHAR(2),
ADD
  COLUMN IF NOT EXISTS dob_match_status_code CHAR(2);

-- ## Comments
COMMENT ON COLUMN sims.sin_validations.request_status_code IS 'This code indicates if the request has been processed successfully.';

COMMENT ON COLUMN sims.sin_validations.match_status_code IS 'This code indicates if the match is successful.';

COMMENT ON COLUMN sims.sin_validations.sin_match_status_code IS 'This code gives some error-clues on the SIN matching.';

COMMENT ON COLUMN sims.sin_validations.surname_match_status_code IS 'This code gives some error-clues on the surname matching.';

COMMENT ON COLUMN sims.sin_validations.given_name_match_status_code IS 'This code gives some error-clues on the given name matching.';

COMMENT ON COLUMN sims.sin_validations.dob_match_status_code IS 'This code gives some error-clues on the Birth-Date matching.';