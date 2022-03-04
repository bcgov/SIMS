CREATE TABLE IF NOT EXISTS sims.sin_validations (
  id SERIAL PRIMARY KEY,
  date_sent TIMESTAMP WITH TIME ZONE,
  date_received TIMESTAMP WITH TIME ZONE,
  file_sent VARCHAR(50),
  file_received VARCHAR(50),
  given_name_sent VARCHAR(50),
  surname_sent VARCHAR(50),
  dob_sent Date,
  valid_sin boolean,
  request_status_code CHAR(2),
  match_status_code CHAR(2),
  sin_match_status_code CHAR(2),
  surname_match_status_code CHAR(2),
  given_name_match_status_code CHAR(2),
  dob_match_status_code CHAR(2),
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  -- Audit columns
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
  SET
    NULL,
    modifier INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
  SET
    NULL
);

-- ## Comments
COMMENT ON TABLE sims.sin_validations IS 'SIN Validations that must be performed for the user.';

COMMENT ON COLUMN sims.sin_validations.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.sin_validations.date_sent IS 'Date and time that the SIN validation file was generated and sent.';

COMMENT ON COLUMN sims.sin_validations.date_received IS 'Date and time that the SIN validation received a response.';

COMMENT ON COLUMN sims.sin_validations.file_sent IS 'Name of the file sent to request an SIN validation.';

COMMENT ON COLUMN sims.sin_validations.file_received IS 'Name of the file received for SIN validation.';

COMMENT ON COLUMN sims.sin_validations.given_name_sent IS 'The user given name to match with the SIN record.';

COMMENT ON COLUMN sims.sin_validations.surname_sent IS 'The user surname to match with the SIN record.';

COMMENT ON COLUMN sims.sin_validations.dob_sent IS 'The user Date of birth to match with the SIN record.';

COMMENT ON COLUMN sims.sin_validations.valid_sin IS 'Indicates the status of the user SIN validation';

COMMENT ON COLUMN sims.sin_validations.request_status_code IS 'This code indicates if the request has been processed successfully.';

COMMENT ON COLUMN sims.sin_validations.match_status_code IS 'This code indicates if the match is successful.';

COMMENT ON COLUMN sims.sin_validations.sin_match_status_code IS 'This code gives some error-clues on the SIN matching.';

COMMENT ON COLUMN sims.sin_validations.surname_match_status_code IS 'This code gives some error-clues on the surname matching.';

COMMENT ON COLUMN sims.sin_validations.given_name_match_status_code IS 'This code gives some error-clues on the given name matching.';

COMMENT ON COLUMN sims.sin_validations.dob_match_status_code IS 'This code gives some error-clues on the Birth-Date matching.';

COMMENT ON COLUMN sims.sin_validations.user_id IS 'Foreign key reference to users table which includes users related information';

COMMENT ON COLUMN sims.sin_validations.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.sin_validations.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.sin_validations.creator IS 'Creator of the record. Null specified the record is created by system.';

COMMENT ON COLUMN sims.sin_validations.modifier IS 'Modifier of the record. Null specified the record is modified by system.';