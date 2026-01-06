-- Insert configurations for student financial aid application form type.
INSERT INTO
    sims.dynamic_form_configurations (
        form_type,
        program_year_id,
        offering_intensity,
        form_definition_name
    )
VALUES
    (
        'Student financial aid application',
        (
            SELECT
                id
            FROM
                sims.program_years
            WHERE
                program_year = '2026-2027'
        ),
        'Full Time',
        'sfaa2026-27-ft'
    ),
    (
        'Student financial aid application',
        (
            SELECT
                id
            FROM
                sims.program_years
            WHERE
                program_year = '2026-2027'
        ),
        'Part Time',
        'sfaa2026-27-pt'
    );

-- Insert configurations for supporting users parent form type.
INSERT INTO
    sims.dynamic_form_configurations (
        form_type,
        program_year_id,
        form_definition_name
    )
VALUES
    (
        'Supporting users parent',
        (
            SELECT
                id
            FROM
                sims.program_years
            WHERE
                program_year = '2026-2027'
        ),
        'supportingusersparent2026-2027'
    );

-- Insert configurations for supporting users partner form type.
INSERT INTO
    sims.dynamic_form_configurations (
        form_type,
        program_year_id,
        form_definition_name
    )
VALUES
    (
        'Supporting users partner',
        (
            SELECT
                id
            FROM
                sims.program_years
            WHERE
                program_year = '2026-2027'
        ),
        'supportinguserspartner2026-2027'
    );