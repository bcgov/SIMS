ALTER TABLE
    sims.dynamic_form_configurations
ADD
    COLUMN form_category sims.form_category_types NOT NULL DEFAULT 'System',
ADD
    COLUMN form_submission_grouping_type sims.form_submission_grouping_types;

COMMENT ON COLUMN sims.dynamic_form_configurations.form_category IS 'Indicates the category of the form.';

COMMENT ON COLUMN sims.dynamic_form_configurations.form_submission_grouping_type IS 'Indicates how the form submissions are grouped, such as part of an application bundle or standalone student form.';

-- Insert new dynamic form configurations with appropriate categories and grouping types
-- for existing appeals and the new 'Non-punitive withdrawal' form.
INSERT INTO
    sims.dynamic_form_configurations (
        form_type,
        form_definition_name,
        form_category,
        form_submission_grouping_type
    )
VALUES
    (
        'Room and board costs',
        'roomandboardcostsappeal',
        'Student appeal',
        'Application bundle'
    ),
    (
        'Step-parent waiver',
        'stepparentwaiverappeal',
        'Student appeal',
        'Application bundle'
    ),
    (
        'Modified independent',
        'modifiedindependentappeal',
        'Student appeal',
        'Student standalone'
    ),
    (
        'Non-punitive withdrawal',
        'nonpunitivewithdrawalform',
        'Student form',
        'Student standalone'
    );