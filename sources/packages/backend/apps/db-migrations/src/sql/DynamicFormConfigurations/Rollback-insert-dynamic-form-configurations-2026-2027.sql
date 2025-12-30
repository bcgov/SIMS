-- Delete all records for dynamic form configurations related to program year 2026-2027 that were added on Insert-dynamic-form-configurations-2026-2027.sql
DELETE FROM
    sims.dynamic_form_configurations
WHERE
    program_year_id = (
        SELECT
            id
        FROM
            sims.program_years
        WHERE
            program_year = '2026-2027'
    );