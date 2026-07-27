-- Postgres does not allow the removal of enum values, only add or rename.
-- To remove the previously added value, a temporary enum is created to
-- allow the recreation of the enum as it was before.
CREATE TYPE sims.form_submission_status_to_rollback AS ENUM ('Pending', 'Completed', 'Declined');

-- Drop the constraint that depends on the enum type to allow the column type change.
ALTER TABLE
    sims.form_submissions DROP CONSTRAINT form_submissions_assessed_fields_required_constraint;

-- Update the dependent column to start using the rollback enum values.
ALTER TABLE
    sims.form_submissions
ALTER COLUMN
    submission_status TYPE sims.form_submission_status_to_rollback USING (
        CASE
            submission_status :: text
            WHEN 'Cancelled' THEN 'Pending'
            ELSE submission_status :: text
        END
    ) :: sims.form_submission_status_to_rollback;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.form_submission_status;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.form_submission_status_to_rollback RENAME TO form_submission_status;

-- Recreate the constraint dropped before changing the enum type.
ALTER TABLE
    sims.form_submissions
ADD
    CONSTRAINT form_submissions_assessed_fields_required_constraint CHECK (
        (
            submission_status != 'Pending' :: sims.form_submission_status
            AND assessed_date IS NOT NULL
            AND assessed_by IS NOT NULL
        )
        OR (
            submission_status = 'Pending' :: sims.form_submission_status
        )
    );

COMMENT ON CONSTRAINT form_submissions_assessed_fields_required_constraint ON sims.form_submissions IS 'Requires assessed_date, and assessed_by when submission_status is not pending.';

COMMENT ON TYPE sims.form_submission_status IS 'This status applies to a submission containing one-to-many forms that require assessment and decision. Once all forms within the submission have been assessed, the submission is marked as Completed or Declined. ''Declined'' indicates that all forms were rejected, whereas ''Completed'' indicates that at least one form was approved. This value is denormalized for easier querying of submission status without needing to evaluate the status of each individual form submission item.';