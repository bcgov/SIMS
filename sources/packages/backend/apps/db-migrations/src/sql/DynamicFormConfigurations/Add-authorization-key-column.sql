ALTER TABLE
    sims.dynamic_form_configurations
ADD
    COLUMN authorization_key VARCHAR(50);

COMMENT ON COLUMN sims.dynamic_form_configurations.authorization_key IS 'Identifier used to associate authorization roles with this form configuration.';

UPDATE
    sims.dynamic_form_configurations
SET
    authorization_key = REPLACE(LOWER(form_type), ' ', '-')
WHERE
    form_category IN ('Student appeal', 'Student form');