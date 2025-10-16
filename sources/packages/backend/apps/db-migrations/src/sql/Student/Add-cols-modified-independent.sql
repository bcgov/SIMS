ALTER TABLE
  sims.students
ADD
  COLUMN modified_independent_status sims.modified_independent_status,
ADD
  COLUMN modified_independent_appeal_request_id INT REFERENCES sims.student_appeal_requests(id);

COMMENT ON COLUMN sims.students.modified_independent_status IS 'Status of the modified independent associated to the student.';

COMMENT ON COLUMN sims.students.modified_independent_appeal_request_id IS 'Reference to the appeal request ID if the student has requested an appeal for the modified independent status.';