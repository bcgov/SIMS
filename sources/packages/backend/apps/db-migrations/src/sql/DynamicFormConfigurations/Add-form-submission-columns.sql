ALTER TABLE
    sims.dynamic_form_configurations
ADD
    COLUMN form_category sims.form_category_types NOT NULL DEFAULT 'System',
ADD
    COLUMN form_description VARCHAR (1000),
ADD
    COLUMN has_application_scope BOOLEAN NOT NULL DEFAULT TRUE,
ADD
    COLUMN allow_bundled_submission BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE
    sims.dynamic_form_configurations
ALTER COLUMN
    has_application_scope DROP DEFAULT,
ALTER COLUMN
    allow_bundled_submission DROP DEFAULT;

COMMENT ON COLUMN sims.dynamic_form_configurations.form_category IS 'Indicates the category of the form.';

COMMENT ON COLUMN sims.dynamic_form_configurations.form_description IS 'Provides a description of the form to be shown to the user submitting it.';

COMMENT ON COLUMN sims.dynamic_form_configurations.has_application_scope IS 'Indicates whether the form must be associated with a Student Application.';

COMMENT ON COLUMN sims.dynamic_form_configurations.allow_bundled_submission IS 'Indicates whether this form can be part of submission that would include multiple forms.';

-- Insert new dynamic form configurations with appropriate categories and grouping types
-- for existing appeals and the new 'Non-punitive withdrawal' form.
INSERT INTO
    sims.dynamic_form_configurations (
        form_type,
        form_definition_name,
        form_category,
        form_description,
        has_application_scope,
        allow_bundled_submission
    )
VALUES
    (
        'Room and board costs',
        'roomandboardcostsappeal',
        'Student appeal',
        'Submit this appeal if, due to exceptional circumstances, your parents, step-parents, or legal guardian are unable to provide the expected free room and board while you reside in their home.',
        TRUE,
        TRUE
    ),
    (
        'Step-parent waiver',
        'stepparentwaiverappeal',
        'Student appeal',
        'Submit this appeal to waive your step-parent''s fixed contribution if your parent has had a recent (within the past five years) marriage or common-law relationship with a step-parent, where the step-parent has not assumed financial responsibility for you and does not claim you as a dependent on their taxes.',
        TRUE,
        TRUE
    ),
    (
        'Modified independent',
        'modifiedindependentappeal',
        'Student appeal',
        'Submit this appeal to change your classification from a dependent student to an independent student based on exceptional circumstances.',
        FALSE,
        FALSE
    ),
    (
        'Non-punitive withdrawal',
        'nonpunitivewithdrawalform',
        'Student form',
        'Submit this form to request the modification of your withdrawal to a non-punitive withdrawal.',
        FALSE,
        FALSE
    );