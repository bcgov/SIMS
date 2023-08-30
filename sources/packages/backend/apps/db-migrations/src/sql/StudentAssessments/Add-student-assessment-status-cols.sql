ALTER TABLE
  sims.student_assessments
ADD
  COLUMN student_assessment_status sims.student_assessment_status NOT NULL DEFAULT 'Submitted';

COMMENT ON COLUMN sims.student_assessments.student_assessment_status IS 'Student assessment status from its creation till the workflow calculations are finalized or the workflow is cancelled.';

ALTER TABLE
  sims.student_assessments
ADD
  COLUMN student_assessment_status_updated_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

COMMENT ON COLUMN sims.student_assessments.student_assessment_status_updated_on IS 'Date and time when the student_assessment_status column was updated.';