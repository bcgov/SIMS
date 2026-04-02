ALTER TABLE
  sims.student_scholastic_standings
ADD
  COLUMN non_punitive_form_submission_item_id INT REFERENCES sims.form_submission_items(id);

COMMENT ON COLUMN sims.student_scholastic_standings.non_punitive_form_submission_item_id IS 'Reference to the form submission item assessed by the Ministry if the student has been approved for a non-punitive withdrawal.';