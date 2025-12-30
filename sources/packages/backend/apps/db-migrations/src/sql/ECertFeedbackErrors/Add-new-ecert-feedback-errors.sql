INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00077',
        'ENTIL ISSUE DATE: MUST BE ON OR BEFORE PSED',
        'Full Time',
        TRUE
    ),
    (
        'LNS-00716',
        'CSG-PT AMOUNT CANNOT EXCEED LIMIT',
        'Part Time',
        TRUE
    ),
    (
        'LNS-BR035',
        'DATE OF ISSUE: MUST BE BEFORE PSED',
        'Part Time',
        TRUE
    ),
    (
        'LNS-00684',
        'PD AMT SHOULD NOT EXCEED $2000, FT & PT COMBINED',
        'Full Time',
        TRUE
    ),
    (
        'LNS-00684',
        'PD AMT SHOULD NOT EXCEED $2000, FT & PT COMBINED',
        'Part Time',
        TRUE
    );