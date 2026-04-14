-- Remove the reference to allow the referenced records to be deleted without violating the foreign key constraint.
UPDATE
    sims.student_assessments
SET
    form_submission_id = NULL
WHERE
    student_appeal_id IN (
        SELECT
            sims.form_submissions.converted_student_appeal_id
        FROM
            sims.form_submissions
        WHERE
            sims.form_submissions.converted_student_appeal_id IS NOT NULL
    );