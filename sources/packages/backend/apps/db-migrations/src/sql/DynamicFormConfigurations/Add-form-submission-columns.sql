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
        'A StudentAid BC Room and Board Appeal allows students living with parents, step-parents, sponsors, or legal guardians to include, in their financial assessment, costs for room and board that they are required to pay, when those individuals cannot afford to provide this support for free.',
        TRUE,
        TRUE
    ),
    (
        'Step-parent waiver',
        'stepparentwaiverappeal',
        'Student appeal',
        'A StudentAid BC Step-parent Waiver Appeal allows dependent students to request that a step-parent''s income be excluded from their financial assessment if the step-parent has not assumed financial responsibility and does not claim the student as a dependent. This appeal is generally for recent marriages or common-law relationships (within 5 years).',
        TRUE,
        TRUE
    ),
    (
        'Modified independent',
        'modifiedindependentappeal',
        'Student appeal',
        'A StudentAid BC Modified Independent Appeal allows a student, normally classified as dependent, to be reassessed as an independent student. This is approved if they have a severe, permanent, and often long-term (1+ year) family relationship breakdown with no communication, or if they were previously in child welfare custody.',
        FALSE,
        FALSE
    ),
    (
        'Non-punitive withdrawal',
        'nonpunitivewithdrawalform',
        'Student form',
        'A StudentAid BC Non-punitive Withdrawal Appeal allows students to remove a withdrawal from their record, preventing it from counting against future funding eligibility. This appeal is used when studies were stopped due to exceptional, documented circumstances—such as medical illness, family emergency, or institutional closure—rather than academic failure.',
        FALSE,
        FALSE
    );