-- Supporting users new columns to alow specific user identification.
ALTER TABLE
    sims.supporting_users
ADD
    COLUMN is_able_to_report boolean NOT NULL DEFAULT TRUE,
ADD
    COLUMN full_name VARCHAR(250),
ADD
    CONSTRAINT supporting_users_application_id_full_name UNIQUE (application_Id, full_name);

COMMENT ON COLUMN sims.supporting_users.is_able_to_report IS 'Indicates if the supporting user will report its own data, otherwise the data will be reported by the student.';

COMMENT ON COLUMN sims.supporting_users.full_name IS 'Used to identify the supporting user when more than one is provided for same application. Should be used for basic identification of the user only, the real name should be captured while supporting user data is provided.';

COMMENT ON CONSTRAINT supporting_users_application_id_full_name ON sims.supporting_users IS 'Ensures that the combination of application_id and full_name is unique within the supporting_users table.';

-- Drop the default constraint to force the value to be set explicitly.
ALTER TABLE
    sims.supporting_users
ALTER COLUMN
    is_able_to_report DROP DEFAULT;

-- Columns to history table be in sync with the original table.
ALTER TABLE
    sims.supporting_users_history
ADD
    COLUMN is_able_to_report boolean,
ADD
    COLUMN full_name VARCHAR(250);

COMMENT ON COLUMN sims.supporting_users_history.is_able_to_report IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.supporting_users_history.full_name IS 'Historical data from the original table. See original table comments for details.';