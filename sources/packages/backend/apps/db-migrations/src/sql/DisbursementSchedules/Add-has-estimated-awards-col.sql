-- Set the default to false initially
ALTER TABLE
    sims.disbursement_schedules
ADD
    COLUMN has_estimated_awards BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN sims.disbursement_schedules.has_estimated_awards IS 'Indication for whether the disbursement has estimated awards greater than $0.';

-- Update query to calculate TRUE | FALSE based on the data.
UPDATE
    sims.disbursement_schedules
SET
    has_estimated_awards = (
        CASE
            when EXISTS (
                SELECT
                    1
                FROM
                    sims.disbursement_values disbursement_value
                WHERE
                    disbursement_value.disbursement_schedule_id = sims.disbursement_schedules.id
                    AND disbursement_value.value_amount > 0
            ) THEN true
            ELSE false
        END
    );

-- Remove the default.
ALTER TABLE
    sims.disbursement_schedules
ALTER COLUMN
    has_estimated_awards DROP DEFAULT;