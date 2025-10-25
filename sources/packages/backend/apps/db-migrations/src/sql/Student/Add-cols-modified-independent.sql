ALTER TABLE
  sims.students
ADD
  COLUMN modified_independent_status sims.modified_independent_status NOT NULL DEFAULT 'Not requested',
ADD
  COLUMN modified_independent_appeal_request_id INT REFERENCES sims.student_appeal_requests(id),
ADD
  COLUMN modified_independent_status_updated_by INT REFERENCES sims.users(id),
ADD
  COLUMN modified_independent_status_updated_on TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN sims.students.modified_independent_status IS 'Status of the modified independent associated to the student.';

COMMENT ON COLUMN sims.students.modified_independent_appeal_request_id IS 'Reference to the appeal request ID if the student has requested an appeal for the modified independent status.';

COMMENT ON COLUMN sims.students.modified_independent_status_updated_by IS 'User who updated the modified independent status.';

COMMENT ON COLUMN sims.students.modified_independent_status_updated_on IS 'Date and time when the modified independent status was updated.';

-- History table new columns.
ALTER TABLE
  sims.students_history
ADD
  COLUMN modified_independent_status sims.modified_independent_status,
ADD
  COLUMN modified_independent_appeal_request_id INT,
ADD
  COLUMN modified_independent_status_updated_by INT,
ADD
  COLUMN modified_independent_status_updated_on TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN sims.students_history.modified_independent_status IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.students_history.modified_independent_appeal_request_id IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.students_history.modified_independent_status_updated_by IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.students_history.modified_independent_status_updated_on IS 'Historical data from the original table. See original table comments for details.';