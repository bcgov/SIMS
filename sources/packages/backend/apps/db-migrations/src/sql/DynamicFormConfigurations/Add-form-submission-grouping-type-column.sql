ALTER TABLE
    sims.dynamic_form_configurations
ADD
    COLUMN form_category sims.form_category_types NOT NULL DEFAULT 'System',
ADD
    COLUMN form_submission_grouping_type sims.form_submission_grouping_types;

COMMENT ON COLUMN sims.dynamic_form_configurations.form_category IS 'Indicates the category of the form.';

COMMENT ON COLUMN sims.dynamic_form_configurations.form_submission_grouping_type IS 'Indicates how the form submissions are grouped, such as part of an application bundle, standalone application, or standalone student form.';