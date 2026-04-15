-- Remove converted data.
DELETE FROM
    sims.form_submissions
WHERE
    converted_student_appeal_id IS NOT NULL;

-- Remove the temporary column after rollback.
ALTER TABLE
    sims.form_submissions DROP COLUMN converted_student_appeal_id;