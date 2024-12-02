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
        WHEN disbursement_total_amounts.value_amount = 0 THEN false
        ELSE true
    END
FROM
    (
        SELECT
            disbursement_schedules.id AS disbursement_schedules_id,
            sum(disbursement_values.value_amount) AS value_amount
        FROM
            sims.disbursement_schedules disbursement_schedules
            INNER JOIN sims.disbursement_values disbursement_values ON disbursement_values.disbursement_schedule_id = disbursement_schedules.id
        GROUP BY
            disbursement_schedules.id
    ) disbursement_total_amounts
WHERE
    sims.disbursement_schedules.id = disbursement_total_amounts.disbursement_schedules_id;

-- Remove the default.
ALTER TABLE
    sims.disbursement_schedules
ALTER COLUMN
    has_estimated_awards DROP DEFAULT;