INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00010',
        'SIN MUST BE NON-ZERO NUMERIC',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00011',
        'ENTITLEMENT IS REC''D BEFORE MSFAA',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00012',
        'NO ACTIVE MSFAA RECORD',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00013',
        'ENTITLEMENT ALREADY DISBURSED',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00014',
        'BORROWER BANKRUPTED; FOS MISSING OR NOT MATCHED',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00015',
        'BORROWER BANKRUPTED; LOAN YEAR FAILED',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00016',
        'INVALID CERT #',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00017',
        'ENTITL ALREADY CANCELLED',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00018',
        'DISB DATE > 30 DAYS IN THE FUTURE',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00019',
        'DISB DATE > 1 YEAR IN THE PAST',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00020',
        'LOAN IN CLASS ''B''',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00021',
        'DISB AMT NOT EQUAL TO TOTAL AWARD',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00022',
        'DISB AMT NOT EQUAL TO STUD + EI AMT',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00023',
        'STUD AMOUNT NOT NUMERIC',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00024',
        'EI AMT NOT NUMERIC',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00025',
        'FED AMT NOT NUMERIC',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00026',
        'FED AMT EXCEEDS $210 PER WEEK FOR ''FT'' LOAN',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00027',
        'BCSL AWARD AMOUNT NOT NUMERIC',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00028',
        'PSED IS BEFORE PROCESS DATE',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00030',
        'YR OF STUDY > TOTAL YRS OF STUDY',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00031',
        'YR OF STUDY MUST BE BETWEEN 1 AND 9',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00032',
        'TOTAL YR OF STUDY MUST BE BETWEEN 1 AND 9',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00033',
        'INVALID TOTAL YR OF STUDY',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00034',
        'INVALID CANCEL DATE',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00035',
        'ENTITL NOT CANCELLED - ALREADY DISB',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00036',
        'ENTITL NOT CANCELLED - ALREADY CANCELLED',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00037',
        'ENTITL NOT CANCELLED - RECORD NOT FOUND',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00038',
        'PT/FT INDICATOR IS NOT ''F''',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00039',
        'PROGRAM TYPE IS NOT ''S'' NOR ''P''',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00040',
        'INVALID CANADIAN PROVINCE CODE',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00041',
        'PROVINCE CODE NOT VALID FOR CAN CITY',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00042',
        'INVALID POSTAL CODE FOR PROV',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00043',
        'INVALID EMAIL FORMAT',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00044',
        'ALT ADDR LINE 1 MISSING',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00045',
        'ALT CITY MISSING',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00046',
        'ALT PROV MISSING FOR CAD ADDR',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00047',
        'ALT PROV CODE INVALID FOR CAD ADDR',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00048',
        'ALT PROV NOT VALID FOR ALT CITY FOR CAD ADDR',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00049',
        'ALT POSTAL CODE MISSING FOR CAD ADDR',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00050',
        'ALT POSTAL CODE FORMAT NOT A#A #A#',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00051',
        'INVALID ALT POSTAL CODE FOR PROV',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00052',
        'ALT COUNTRY INVALID',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00053',
        'TOTAL GRANT AMT MUST BE = ALL AWARDED GRANTS (CSGP + BC Prov. Part-time Grants)',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00054',
        'GRANT CODE MISSING',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00055',
        'INVALID GRANT CODE',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00056',
        'MISSING GRANT AMOUNT',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00057',
        'SIN RESTRICTED',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00058',
        'E-CERT INDICATOR IS NOT ''E''',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00059',
        'EI SIGN DATE CANNOT BE > 35 DAYS IN THE FUTURE',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00060',
        'BORROWER - RTG OR D/T',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00061',
        'EI AMT > TOTAL FED +CSGP+PROV AMT',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00062',
        'EI SIGN DATE CANNOT BE > 35 DAYS IN THE PAST',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00064',
        'DISB AMT NOT NUMERIC',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00070',
        'MISSING BANKING INFO',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00072',
        'CERT # IS NOT PROVIDED',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00073',
        'DISB DATE INVALID FORMAT',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00074',
        'DISB DATE MUST BE <= EOS DATE',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00075',
        'ENTITL ISSUE DATE MUST BE <= PROCESS DATE',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00076',
        'ENTITL ISSUE DATE INVALID FORMAT',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00078',
        'INVALID PSCD',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00079',
        'PSCD MUST BE BEFORE PSED',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00080',
        'PSED INVALID',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00081',
        'INVALID EI CODE',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00082',
        'EI CODE MISSING',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00083',
        'WK OF STUDY MUST BE BETWEEN 6 AND 66',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00084',
        'INVALID FOS CODE',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00085',
        'FOS CODE MISSING',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00086',
        'YR OF STUDY NOT NUMERIC',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00087',
        'EI SIGN DATE MISSING',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00088',
        'INVALID EI SIGN DATE',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00089',
        'EI SIGN DATE: MUST BE ON OR BEFORE PSED',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00090',
        'BORROWER MUST BE OLDER THAN 11 YRS',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00091',
        'DOB MISSING',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00092',
        'INVALID DOB',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00093',
        'LAST NAME MISSING',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00094',
        'FIRST NAME MISSING',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00095',
        'BORROWER MAILING ADDR LINE 1 MISSING',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00096',
        'MISSING CITY',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00097',
        'MISSING CANADIAN PROV',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00098',
        'POSTAL CODE MISSING FOR CAN ADDR',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00099',
        'POSTAL CODE FORMAT NOT A#A #A#',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00100',
        'INVALID COUNTRY',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00101',
        'GENDER MUST BE M OR F',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00102',
        'GENDER MISSING',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00103',
        'MARITAL STATUS MISSING',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00104',
        'MARITAL STATUS MUST BE ''S'', ''M'' OR ''O''',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00105',
        'CSG-FT AMOUNT CANNOT EXCEED LIMIT',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00106',
        'TU IS 0(PSCD<08/01/18) OR <= 2400(PSCD>=08/01/18)',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00107',
        'LI & MI GRANTS ARE MUTUALLY EXCLUSIVE',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00108',
        'PD AMT AUTHORIZED CANNOT EXCEED LIMIT',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00109',
        'FTDEP AMOUNT SHOULD NOT EXCEED $15,000',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00110',
        'ENTITL ISSUE DATE MISSING',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00111',
        'INVALID ADDRESS IN SYSTEM',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00112',
        'LANG IND MUST BE E OR F',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00120',
        'EI AMT > CSL AMOUNT + NL AMOUNT + CSGP',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00121',
        'PROVINCIAL AWARD AMOUNT NOT NUMERIC',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00122',
        'TOTAL AWARD AMOUNT NOT = CSL AMOUNT + NL AMOUNT',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00123',
        'INVALID CONFIRMATION STATUS',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00124',
        'CERTIFICATE OF ELIGIBILITY STATUS NOT VALID',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00125',
        'INVALID/NON-NUMERIC PROV GRANT',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00126',
        'FUNDING TYPE NOT VALID',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00127',
        'COURSE LOAD MUST BE BETWEEN 40 AND 99',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00128',
        'EI AMT > TOTAL FED + CSGP',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00129',
        'CLIENT FILE NO. MISSING OR NOT NUMERIC',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00130',
        'INVALID RECORD TYPE',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00131',
        'SIN FAILED MOD 10 CHECK',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00132',
        'WEEKS OF STUDY NOT VALID',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00133',
        'MARITAL STATUS NOT VALID',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00134',
        'MSFAA PREVIOUSLY SENT, THEN EXCEPTIONED',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00135',
        'MSFAA CANCELLED BY ANOTHER PROVINCE',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00136',
        'Invalid Year Type',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00137',
        'Invalid Change Code',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00138',
        'Non-Numeric CSGP Amount',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00139',
        'INVALID MP DATE',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00140',
        'MP AMT S/B ZERO IF NBD AMT FOR SAME GRANT IS ZERO',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00141',
        'CLIENT FILE NO. MISMATCH',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00142',
        'INVALID REVISION DATE',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00143',
        'REV AMOUNT > ORIGINAL AMOUNT',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00144',
        'NO CHANGE IN AMOUNT NOR EOS',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00145',
        'CONF STATUS MUST BE ''E'' or ''M'' IF PSCD < AUG 2012',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00146',
        'CONF STATUS MUST BE ''C'' OR ''U'' IF PSCD > JULY 2012',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00147',
        'THE SUM OF FT & TG CANNOT EXCEED LIMIT',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00148',
        'UPDATE NOT ALLOWED; FE AMT NE 0',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00149',
        'UPDATE NOT ALLOWED; PR AMT NE 0',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00150',
        'PD INDICATOR MUST BE ''Y'' OR ''N''',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00151',
        'CONF STATUS MUST BE ''U'' IF PSCD > JULY 2013',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00154',
        'PROGR OF STUDY CAN''T BE BLANK IF CONF STAT IS ''U''',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00155',
        'CONF STATUS MUST BE ''C'' IF PSCD > JULY 2013',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00156',
        'CONF STATUS MUST BE ''E'' or ''M'' IF PSCD < AUG 2013',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00157',
        'CONF STATUS MUST BE ''M'' IF PSCD < AUG 2013',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00158',
        'EI AMT > CSL AMT + NB AMT + CSGP + NB GRANTS',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00159',
        'CONF STATUS MUST BE ''U''',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00160',
        'TOTAL AWARD AMOUNT NOT = CSL AMOUNT + NB AMOUNT',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00161',
        'EI AMT > TOTAL FED',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00162',
        'ENT METHOD MUST BE ''2'' IF PSCD > JULY 2013',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00163',
        'ENT METHOD MUST BE ''1'' IF PSCD < AUG 2013',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00164',
        'APPL ID NOT NUMERIC',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00165',
        'CONF AUTH ID MANDATORY IF CONF IND IS ''C''',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00166',
        'EI AMT > TOTAL FED + CSGP + PROV AMT + PROV GRANTS',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00167',
        'PDSE AMT AUTHORIZED CANNOT EXCEED LIMIT',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00168',
        'AWARD AMOUNT OR TOTAL CSGP GRANT MUST BE > ZERO',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00169',
        'ENT METHOD MUST BE ''1'' FOR PART-TIME CERTIFICATES',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00170',
        'EI AMT CANNOT EQUAL $2.00 OR LESS',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00171',
        'BORROWER AMT CANNOT EQUAL $2.00 OR LESS',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00172',
        'PROV GRANT AMT CANNOT BE > 0 IF PSCD < AUG 1, 2017',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00173',
        'INVALID SK MP DATE',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00174',
        'CSG-LI MUST BE 0 IF PSCD >= AUG 1 2017',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00175',
        'CSG-MI MUST BE 0 IF PSCD >= AUG 1 2017',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'LNS-00696',
        'PDSE MUST EQUAL TO $0',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00194',
        'INVALID PT/FT INDICATOR',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-10111',
        'CSG-PT CANNOT EXCEED LIMIT',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-10113',
        'CSG-PTDEP CANNOT EXCEED LIMIT',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-10127',
        'COURSE LOAD MUST BE BETWEEN 20 AND 59',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00188',
        'PT BORROWER IN BANKRUPTCY - DISB NOT ALLOWED',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00182',
        'FED LOAN AMT EXCEEDS $10 000',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00190',
        'PROV LOAN AND GRANT AMTS MUST BE ZERO FOR PT E-CERTS',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00191',
        'CONF STATUS MUST BE C',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00192',
        'ENROL CONF MUST BE ''C'' OR ''U'' IF PSCD > JULY 2019',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00193',
        'ENT METHOD MUST BE ''2'' FOR PART-TIME CERTIFICATES',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00195',
        'PSCD MUST BE > JULY 2019 for PT ECERTS',
        'Part Time',
        FALSE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00197',
        'Invalid/non-numeric BC provincial part time grant amount',
        'Part Time',
        TRUE
    );

INSERT INTO
    sims.ecert_feedback_errors (
        error_code,
        error_description,
        offering_intensity,
        block_funding
    )
VALUES
    (
        'EDU-00999',
        'ERROR CODE LIMIT REACHED',
        'Part Time',
        TRUE
    );