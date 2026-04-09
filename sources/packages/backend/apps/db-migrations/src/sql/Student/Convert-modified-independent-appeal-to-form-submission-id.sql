UPDATE
    sims.students
SET
    modified_independent_form_submission_item_id = sims.form_submission_items.id
FROM
    sims.form_submission_items
WHERE
    sims.form_submission_items.converted_student_appeal_request_id = sims.students.modified_independent_appeal_request_id;