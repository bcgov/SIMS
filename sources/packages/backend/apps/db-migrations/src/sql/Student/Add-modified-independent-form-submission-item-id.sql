ALTER TABLE
  sims.students
ADD
  COLUMN modified_independent_form_submission_item_id INT REFERENCES sims.form_submission_items(id);

COMMENT ON COLUMN sims.students.modified_independent_form_submission_item_id IS 'Reference to the form submission item assessed by the Ministry if the student has requested an appeal for the modified independent status.';

ALTER TABLE
  sims.students_history
ADD
  COLUMN modified_independent_form_submission_item_id INT;

COMMENT ON COLUMN sims.students_history.modified_independent_form_submission_item_id IS 'Historical data from the original table. See original table comments for details.';