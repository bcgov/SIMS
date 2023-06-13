ALTER TABLE
  sims.student_assessments
ADD
  COLUMN application_offering_change_request_id INT REFERENCES sims.application_offering_change_requests(id);

COMMENT ON COLUMN sims.student_assessments.application_offering_change_request_id IS 'Application offering change request details for the assessment.';