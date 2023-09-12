/**
 Updates all assessments associated with active applications.
 */
UPDATE
  sims.student_assessments sa
SET
  student_assessment_status = (
    CASE
      WHEN sa.assessment_data IS NOT NULL THEN 'Completed'
      WHEN sa.assessment_workflow_id IS NOT NULL
      AND sa.assessment_data IS NULL THEN 'In progress'
      ELSE 'Submitted'
    END
  ) :: sims.student_assessment_status
FROM
  sims.applications a
WHERE
  sa.application_id = a.id
  AND a.application_status IN (
    'Submitted',
    'In Progress',
    'Assessment',
    'Enrolment',
    'Completed'
  );

-- Update all assessments associated with no longer active applications.
UPDATE
  sims.student_assessments
SET
  student_assessment_status = 'Cancelled'
FROM
  sims.applications
WHERE
  application_id = sims.applications.id
  AND sims.applications.application_status NOT IN (
    'Submitted',
    'In Progress',
    'Assessment',
    'Enrolment',
    'Completed'
  );