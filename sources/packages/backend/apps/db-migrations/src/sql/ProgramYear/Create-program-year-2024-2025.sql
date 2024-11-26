INSERT INTO
    sims.program_years(
        program_year,
        program_year_desc,
        form_name,
        is_active,
        start_date,
        end_date,
        parent_form_name,
        partner_form_name,
        program_year_prefix,
        max_lifetime_bc_loan_amount
    )
VALUES
    (
        '2024-2025',
        'Study starting between August 01, 2024 and July 31, 2025',
        'SFAA2024-25',
        TRUE,
        '2024-08-01',
        '2025-07-31',
        'supportingusersparent2024-2025',
        'supportinguserspartner2024-2025',
        '2024',
        50000
    );