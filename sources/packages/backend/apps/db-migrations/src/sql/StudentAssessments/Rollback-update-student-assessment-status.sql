/*
 Rollback assessments status updates.
 The workflow is already changing the status to 'In progress' and 'Completed',
 anything different can be considered as the default column value 'Submitted'.
 */
UPDATE
  sims.student_assessments
SET
  student_assessment_status = 'Submitted'
WHERE
  student_assessment_status NOT IN ('In progress', 'Completed')