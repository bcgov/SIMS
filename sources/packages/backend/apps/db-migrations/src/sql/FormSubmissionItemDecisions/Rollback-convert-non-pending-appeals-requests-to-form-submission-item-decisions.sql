-- Remove converted data.
DELETE FROM
    sims.form_submission_item_decisions
WHERE
    converted_student_appeal_request_id IS NOT NULL;

-- Remove the temporary column after rollback.
ALTER TABLE
    sims.form_submission_item_decisions DROP COLUMN converted_student_appeal_request_id;