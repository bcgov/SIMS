ALTER TABLE
    sims.students_history DROP COLUMN disability_status_form_submission_item_id,
    DROP COLUMN disability_status_updated_by;

ALTER TABLE
    sims.students_history RENAME COLUMN disability_status_updated_on TO pd_date_update;

ALTER TABLE
    sims.students DROP COLUMN disability_status_form_submission_item_id,
    DROP COLUMN disability_status_updated_by;

ALTER TABLE
    sims.students RENAME COLUMN disability_status_updated_on TO pd_date_update;

COMMENT ON COLUMN sims.students.pd_date_update IS 'Permanent Disability status updated at';