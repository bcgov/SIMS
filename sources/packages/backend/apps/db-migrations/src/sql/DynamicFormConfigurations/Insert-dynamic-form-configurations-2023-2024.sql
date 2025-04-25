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
                program_year = '2023-2024'
        ),
        'Full Time',
        'SFAA2023-24'
    ),
    (
        'Student financial aid application',
        (
            select
                id
            from
                sims.program_years
            where
                program_year = '2023-2024'
        ),
        'Part Time',
        'SFAA2023-24'
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
                program_year = '2023-2024'
        ),
        'supportingusersparent2022-2023'
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
                program_year = '2023-2024'
        ),
        'supportinguserspartner2022-2023'
    );