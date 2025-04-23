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
            select
                id
            from
                sims.program_years
            where
                program_year = '2025-2026'
        ),
        'Full Time',
        'SFAA2025-26-FT'
    ),
    (
        'Student financial aid application',
        (
            select
                id
            from
                sims.program_years
            where
                program_year = '2025-2026'
        ),
        'Part Time',
        'SFAA2025-26-PT'
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
            select
                id
            from
                sims.program_years
            where
                program_year = '2025-2026'
        ),
        'supportingusersparent2025-2026'
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
            select
                id
            from
                sims.program_years
            where
                program_year = '2025-2026'
        ),
        'supportinguserspartner2025-2026'
    );