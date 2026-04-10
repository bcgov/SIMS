-- Remove the reference to allow the referenced records to be deleted without violating the foreign key constraint.
UPDATE
    sims.form_submission_items
SET
    current_decision_id = NULL
WHERE
    current_decision_id IN (
        SELECT
            id
        FROM
            sims.form_submission_item_decisions
        WHERE
            converted_student_appeal_request_id IS NOT NULL
    );

-- Remove converted data.
DELETE FROM
    sims.form_submission_item_decisions
WHERE
    converted_student_appeal_request_id IS NOT NULL;

-- Remove the temporary column after rollback.
ALTER TABLE
    sims.form_submission_item_decisions DROP COLUMN converted_student_appeal_request_id;