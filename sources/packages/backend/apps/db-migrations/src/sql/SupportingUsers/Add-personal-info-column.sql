ALTER TABLE
    sims.supporting_users
ADD
    COLUMN personal_info JSONB;

COMMENT ON COLUMN sims.supporting_users.personal_info IS 'Personal information of the supporting user who cannot report by themselves and hence provided by the student.';

-- Columns to history table be in sync with the original table.
ALTER TABLE
    sims.supporting_users_history
ADD
    COLUMN personal_info JSONB;

COMMENT ON COLUMN sims.supporting_users_history.personal_info IS 'Historical data from the original table. See original table comments for details.';