ALTER TABLE
    sims.students
ADD
    COLUMN disability_status_form_submission_item_id INT REFERENCES sims.form_submission_items(id),
ADD
    COLUMN disability_status_updated_by INT REFERENCES sims.users(id);

ALTER TABLE
    sims.students RENAME COLUMN pd_date_update TO disability_status_updated_on;

COMMENT ON COLUMN sims.students.disability_status_form_submission_item_id IS 'Form submission item assessed by the ministry for a disability status application.';

COMMENT ON COLUMN sims.students.disability_status_updated_by IS 'User who updated the disability status.';

-- History table new columns.
ALTER TABLE
    sims.students_history
ADD
    COLUMN disability_status_form_submission_item_id INT,
ADD
    COLUMN disability_status_updated_by INT;

ALTER TABLE
    sims.students_history RENAME COLUMN pd_date_update TO disability_status_updated_on;

COMMENT ON COLUMN sims.students_history.disability_status_form_submission_item_id IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.students_history.disability_status_updated_by IS 'Historical data from the original table. See original table comments for details.';