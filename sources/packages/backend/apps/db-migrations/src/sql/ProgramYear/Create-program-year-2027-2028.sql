-- Create program year 2027-2028
INSERT INTO
    sims.program_years (
        program_year,
        program_year_desc,
        is_active,
        start_date,
        end_date,
        program_year_prefix,
        max_lifetime_bc_loan_amount,
        offering_intensity
    )
VALUES
    (
        '2027-2028',
        'My first day of classes starts between August 01, 2027 and July 31, 2028',
        FALSE,
        '2027-08-01',
        '2028-07-31',
        '2027',
        50000,
        ARRAY['Part Time', 'Full Time']::sims.offering_intensity[]
    );