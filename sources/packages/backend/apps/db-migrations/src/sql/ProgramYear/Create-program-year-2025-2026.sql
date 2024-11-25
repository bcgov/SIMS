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
        '2025-2026',
        'Study starting between August 01, 2025 and July 31, 2026',
        'SFAA2025-26',
        TRUE,
        '2025-08-01',
        '2026-07-31',
        'supportingusersparent2025-2026',
        'supportinguserspartner2025-2026',
        '2025',
        50000
    );