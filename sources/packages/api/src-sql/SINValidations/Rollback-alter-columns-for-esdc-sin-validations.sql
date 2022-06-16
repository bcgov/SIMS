-- Remove columns from ESDC SIN validation schema.
ALTER TABLE
  sims.sin_validations DROP COLUMN sin_status,
  DROP COLUMN IF EXISTS valid_sin,
  DROP COLUMN IF EXISTS valid_birthdate,
  DROP COLUMN IF EXISTS valid_first_name,
  DROP COLUMN IF EXISTS valid_last_name,
  DROP COLUMN IF EXISTS valid_gender_name,
  DROP COLUMN IF EXISTS manual_edited_by,
  DROP COLUMN IF EXISTS manual_edited_date,
  DROP COLUMN IF EXISTS manual_edited_note_id;

-- Add columns for the CRA SIN validation.
ALTER TABLE
  sims.sin_validations
ADD
  COLUMN IF NOT EXISTS given_name_sent VARCHAR(50),
ADD
  COLUMN IF NOT EXISTS surname_sent VARCHAR(50),
ADD
  COLUMN IF NOT EXISTS dob_sent Date,
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
COMMENT ON COLUMN sims.sin_validations.given_name_sent IS 'The user given name to match with the SIN record.';

COMMENT ON COLUMN sims.sin_validations.surname_sent IS 'The user surname to match with the SIN record.';

COMMENT ON COLUMN sims.sin_validations.dob_sent IS 'The user Date of birth to match with the SIN record.';

COMMENT ON COLUMN sims.sin_validations.request_status_code IS 'This code indicates if the request has been processed successfully.';

COMMENT ON COLUMN sims.sin_validations.match_status_code IS 'This code indicates if the match is successful.';

COMMENT ON COLUMN sims.sin_validations.sin_match_status_code IS 'This code gives some error-clues on the SIN matching.';

COMMENT ON COLUMN sims.sin_validations.surname_match_status_code IS 'This code gives some error-clues on the surname matching.';

COMMENT ON COLUMN sims.sin_validations.given_name_match_status_code IS 'This code gives some error-clues on the given name matching.';

COMMENT ON COLUMN sims.sin_validations.dob_match_status_code IS 'This code gives some error-clues on the Birth-Date matching.';