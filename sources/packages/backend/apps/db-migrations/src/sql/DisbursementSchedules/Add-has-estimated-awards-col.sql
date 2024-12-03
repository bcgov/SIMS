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
    has_estimated_awards = CASE
        WHEN disbursement_total_amounts.value_amount > 0 THEN true
        ELSE false
    END
FROM
    (
        SELECT
            disbursement_value.disbursement_schedule_id AS disbursement_schedule_id,
            sum(disbursement_value.value_amount) AS value_amount
        FROM
            sims.disbursement_values disbursement_value
        GROUP BY
            disbursement_value.disbursement_schedule_id
    ) disbursement_total_amounts
WHERE
    sims.disbursement_schedules.id = disbursement_total_amounts.disbursement_schedule_id;

-- Remove the default.
ALTER TABLE
    sims.disbursement_schedules
ALTER COLUMN
    has_estimated_awards DROP DEFAULT;