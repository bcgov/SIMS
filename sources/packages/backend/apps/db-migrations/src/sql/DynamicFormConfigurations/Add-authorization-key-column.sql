ALTER TABLE
    sims.dynamic_form_configurations
ADD
    COLUMN authorization_key VARCHAR(50);

COMMENT ON COLUMN sims.dynamic_form_configurations.authorization_key IS 'Identifier used to associate authorization roles with this form configuration.';

UPDATE
    sims.dynamic_form_configurations
SET
    authorization_key = 'sbsd-eligibility-appeal'
WHERE
    form_definition_name IN (
        'ptaccessibilitygranteligibilityappeal',
        'ftaccessibilitygranteligibilityappeal'
    );

UPDATE
    sims.dynamic_form_configurations
SET
    authorization_key = REPLACE(LOWER(form_type), ' ', '-')
WHERE
    form_category IN ('Student appeal', 'Student form')
    AND authorization_key IS NULL;

-- Enforce that authorization_key is provided for student appeals and student forms.
ALTER TABLE
    sims.dynamic_form_configurations
ADD
    CONSTRAINT dynamic_form_configurations_authorization_key_not_null_constraint CHECK (
        form_category NOT IN ('Student appeal', 'Student form')
        OR (
            authorization_key IS NOT NULL
            AND LENGTH(authorization_key) >= 1
        )
    );

COMMENT ON CONSTRAINT dynamic_form_configurations_authorization_key_not_null_constraint ON sims.dynamic_form_configurations IS 'Ensures that authorization_key is provided and non-empty for Student appeal and Student form categories.';