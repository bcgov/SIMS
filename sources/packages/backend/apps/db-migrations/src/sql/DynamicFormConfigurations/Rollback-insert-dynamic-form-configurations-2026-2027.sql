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
            AND (
                (
                    form_type = 'Student financial aid application'
                    AND form_definition_name IN ('SFAA2026-27-FT', 'SFAA2026-27-PT')
                )
                OR (
                    form_type = 'Supporting users parent'
                    AND form_definition_name = 'supportingusersparent2026-2027'
                )
                OR (
                    form_type = 'Supporting users partner'
                    AND form_definition_name = 'supportinguserspartner2026-2027'
                )
            )
    );