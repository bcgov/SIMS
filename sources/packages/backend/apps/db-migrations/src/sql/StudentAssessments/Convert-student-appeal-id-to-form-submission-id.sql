UPDATE
    sims.student_assessments
SET
    form_submission_id = sims.form_submissions.id
FROM
    sims.form_submissions
WHERE
    sims.form_submissions.converted_student_appeal_id = sims.student_assessments.student_appeal_id;