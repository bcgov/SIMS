-- Add submitted_by to education_programs_offerings table.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS submitted_by INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
SET
    NULL;

COMMENT ON COLUMN sims.education_programs_offerings.submitted_by IS 'Education program offering submitted by institution user.';

-- Add submitted_by to education_programs_offerings_history table.
ALTER TABLE
    sims.education_programs_offerings_history
ADD
    COLUMN IF NOT EXISTS submitted_by INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
SET
    NULL;

COMMENT ON COLUMN sims.education_programs_offerings_history.submitted_by IS 'Education program offering submitted by institution user.';

-- Update existing records to set submitted_by with creator value.
UPDATE
    sims.education_programs_offerings
SET
    submitted_by = CASE
        WHEN creator IS NOT NULL THEN creator
        ELSE (
            SELECT
                id
            FROM
                sims.users
            WHERE
                -- System user.
                user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system'
        )
    END;

UPDATE
    sims.education_programs_offerings_history
SET
    submitted_by = CASE
        WHEN creator IS NOT NULL THEN creator
        ELSE (
            SELECT
                id
            FROM
                sims.users
            WHERE
                -- System user.
                user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system'
        )
    END;

-- Set submitted_by as NOT NULL.
ALTER TABLE
    sims.education_programs_offerings
ALTER COLUMN
    submitted_by
SET
    NOT NULL;

ALTER TABLE
    sims.education_programs_offerings_history
ALTER COLUMN
    submitted_by
SET
    NOT NULL;