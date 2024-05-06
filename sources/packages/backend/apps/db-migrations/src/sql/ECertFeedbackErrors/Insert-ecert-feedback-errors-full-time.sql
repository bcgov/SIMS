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
        'Full Time',
        TRUE
    ),
    (
        'EDU-00011',
        'ENTITLEMENT IS REC''D BEFORE MSFAA',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00012',
        'NO ACTIVE MSFAA RECORD',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00013',
        'ENTITLEMENT ALREADY DISBURSED',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00014',
        'BORROWER BANKRUPTED, FOS MISSING OR NOT MATCHED',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00015',
        'BORROWER BANKRUPTED, LOAN YEAR FAILED',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00016',
        'INVALID CERT #',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00017',
        'ENTITL ALREADY CANCELLED',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00018',
        'DISB DATE > 30 DAYS IN THE FUTURE',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00019',
        'DISB DATE > 1 YEAR IN THE PAST',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00020',
        'LOAN IN CLASS ''B''',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00021',
        'DISB AMT NOT EQUAL TO TOTAL AWARD',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00022',
        'DISB AMT NOT EQUAL TO STUD + EI AMT',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00023',
        'STUD AMOUNT NOT NUMERIC',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00024',
        'EI AMT NOT NUMERIC',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00025',
        'FED AMT NOT NUMERIC',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00026',
        'FED AMT EXCEEDS $210 PER WEEK FOR ''FT'' LOAN',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00027',
        'BCSL AWARD AMOUNT NOT NUMERIC',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00028',
        'PSED IS BEFORE PROCESS DATE',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00029',
        'PSED IS > 13 MONTHS IN FUTURE',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00030',
        'YR OF STUDY > TOTAL YRS OF STUDY',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00031',
        'YR OF STUDY MUST BE BETWEEN 1 AND 9',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00032',
        'TOTAL YR OF STUDY MUST BE BETWEEN 1 AND 9',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00033',
        'INVALID TOTAL YR OF STUDY',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00034',
        'INVALID CANCEL DATE',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00035',
        'ENTITL NOT CANCELLED - ALREADY DISB',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00036',
        'ENTITL NOT CANCELLED - ALREADY CANCELLED',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00037',
        'ENTITL NOT CANCELLED - RECORD NOT FOUND',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00038',
        'PT/FT INDICATOR IS NOT ''F''',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00040',
        'INVALID CANADIAN PROVINCE CODE',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00041',
        'PROVINCE CODE NOT VALID FOR CAN CITY',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00042',
        'INVALID POSTAL CODE FOR PROV',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00043',
        'INVALID EMAIL FORMAT',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00044',
        'ALT ADDR LINE 1 MISSING',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00045',
        'ALT CITY MISSING',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00046',
        'ALT PROV MISSING FOR CAD ADDR',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00047',
        'ALT PROV CODE INVALID FOR CAD ADDR',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00048',
        'ALT PROV NOT VALID FOR ALT CITY FOR CAD ADDR',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00049',
        'ALT POSTAL CODE MISSING FOR CAD ADDR',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00050',
        'ALT POSTAL CODE FORMAT NOT A#A #A#',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00051',
        'INVALID ALT POSTAL CODE FOR PROV',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00052',
        'ALT COUNTRY INVALID',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00053',
        'TOTAL GRANT AMT MUST BE = ALL AWARDED GRANTS',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00054',
        'GRANT CODE MISSING',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00055',
        'INVALID GRANT CODE',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00056',
        'MISSING GRANT AMOUNT',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00057',
        'SIN RESTRICTED',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00058',
        'E-CERT INDICATOR IS NOT ''E''',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00059',
        'EI SIGN DATE CANNOT BE > 35 DAYS IN THE FUTURE',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00060',
        'BORROWER - RTG OR B/D/T',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00061',
        'EI AMT > TOTAL FED +CSGP+PROV AMT',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00062',
        'EI SIGN DATE CANNOT BE > 35 DAYS IN THE PAST',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00064',
        'DISB AMT NOT NUMERIC',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00070',
        'MISSING BANKING INFO',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00071',
        '2-YR BREAK IN STUDY',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00072',
        'CERT # IS NOT PROVIDED',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00073',
        'DISB DATE INVALID FORMAT',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00074',
        'DISB DATE MUST BE <= EOS DATE',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00075',
        'ENTITL ISSUE DATE MUST BE <= PROCESS DATE',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00076',
        'ENTITL ISSUE DATE INVALID FORMAT',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00078',
        'INVALID PSCD',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00079',
        'PSCD MUST BE BEFORE PSED',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00080',
        'PSED INVALID',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00081',
        'INVALID EI CODE',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00082',
        'EI CODE MISSING',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00083',
        'WK OF STUDY MUST BE BETWEEN 6 AND 66',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00084',
        'INVALID FOS CODE',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00085',
        'FOS CODE MISSING',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00086',
        'YR OF STUDY NOT NUMERIC',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00087',
        'EI SIGN DATE MISSING',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00088',
        'INVALID EI SIGN DATE',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00089',
        'EI SIGN DATE: MUST BE ON OR BEFORE PSED',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00090',
        'BORROWER MUST BE OLDER THAN 11 YRS',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00091',
        'DOB MISSING',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00092',
        'INVALID DOB',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00093',
        'LAST NAME MISSING',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00094',
        'FIRST NAME MISSING',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00095',
        'BORROWER MAILING ADDR LINE 1 MISSING',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00096',
        'MISSING CITY',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00097',
        'MISSING CANADIAN PROV',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00098',
        'POSTAL CODE MISSING FOR CAN ADDR',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00099',
        'POSTAL CODE FORMAT NOT A#A #A#',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00100',
        'INVALID COUNTRY',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00101',
        'GENDER MUST BE M OR F',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00102',
        'GENDER MISSING',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00103',
        'MARITAL STATUS MISSING',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00104',
        'MARITAL STATUS MUST BE ''S'', ''M'' OR ''O''',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00105',
        'LI AMT AUTHORIZED CANNOT BE > $3,000 PER LOAN YEAR',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00106',
        'MI AMOUNT SHOULD NOT EXCEED $1,200',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00107',
        'LI & MI GRANTS ARE MUTUALLY EXCLUSIVE',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00108',
        'PD AMT AUTHORIZED CANNOT BE > $2,000 PER LOAN YEAR',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00109',
        'FTDEP AMOUNT SHOULD NOT EXCEED $15,000',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00110',
        'ENTITL ISSUE DATE MISSING',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00111',
        'INVALID ADDRESS IN SYSTEM',
        'Full Time',
        TRUE
    ),
    (
        'EDU-00112',
        'LANG IND MUST BE E OR F',
        'Full Time',
        TRUE
    );