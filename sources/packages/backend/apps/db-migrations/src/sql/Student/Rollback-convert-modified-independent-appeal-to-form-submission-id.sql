-- Remove the reference to allow the referenced records to be deleted without violating the foreign key constraint.
UPDATE
    sims.students
SET
    modified_independent_form_submission_item_id = NULL
WHERE
    modified_independent_appeal_request_id IN (
        SELECT
            sims.form_submission_items.converted_student_appeal_request_id
        FROM
            sims.form_submission_items
        WHERE
            sims.form_submission_items.converted_student_appeal_request_id IS NOT NULL
    );