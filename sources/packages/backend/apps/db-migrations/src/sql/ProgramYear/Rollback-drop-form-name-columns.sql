ALTER TABLE
    sims.program_years
ADD
    COLUMN form_name VARCHAR(100);

ALTER TABLE
    sims.program_years
ADD
    COLUMN parent_form_name VARCHAR(100);

ALTER TABLE
    sims.program_years
ADD
    COLUMN partner_form_name VARCHAR(100);

COMMENT ON COLUMN sims.program_years.form_name IS 'Form to be loaded for a particular Program year';

COMMENT ON COLUMN sims.program_years.parent_form_name IS 'Parent form to be loaded for a particular Program year.';

COMMENT ON COLUMN sims.program_years.partner_form_name IS 'Partner form to be loaded for a particular Program year.';

UPDATE
    sims.program_years
SET
    form_name = 'SFAA2021-22',
    parent_form_name = 'supportingusersparent2021-2022',
    partner_form_name = 'supportinguserspartner2021-2022'
WHERE
    program_year = '2021-2022';

UPDATE
    sims.program_years
SET
    form_name = 'SFAA2022-23',
    parent_form_name = 'supportingusersparent2022-2023',
    partner_form_name = 'supportinguserspartner2022-2023'
WHERE
    program_year = '2022-2023';

UPDATE
    sims.program_years
SET
    form_name = 'SFAA2023-24',
    parent_form_name = 'supportingusersparent2022-2023',
    partner_form_name = 'supportinguserspartner2022-2023'
WHERE
    program_year = '2023-2024';

UPDATE
    sims.program_years
SET
    form_name = 'SFAA2024-25',
    parent_form_name = 'supportingusersparent2024-2025',
    partner_form_name = 'supportinguserspartner2024-2025'
WHERE
    program_year = '2024-2025';

UPDATE
    sims.program_years
SET
    form_name = 'SFAA2025-26',
    parent_form_name = 'supportingusersparent2025-2026',
    partner_form_name = 'supportinguserspartner2025-2026'
WHERE
    program_year = '2025-2026';

-- Set the columns to be not null after the update.
ALTER TABLE
    sims.program_years
ALTER COLUMN
    form_name
SET
    NOT NULL,
ALTER COLUMN
    parent_form_name
SET
    NOT NULL,
ALTER COLUMN
    partner_form_name
SET
    NOT NULL;