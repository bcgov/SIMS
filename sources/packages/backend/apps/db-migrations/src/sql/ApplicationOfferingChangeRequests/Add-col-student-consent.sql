-- Create student consent column. 
ALTER TABLE
  sims.application_offering_change_requests
ADD
  COLUMN student_consent BOOLEAN DEFAULT false;

COMMENT ON COLUMN sims.application_offering_change_requests.student_consent IS 'Indicates student consent for application offering change request.';