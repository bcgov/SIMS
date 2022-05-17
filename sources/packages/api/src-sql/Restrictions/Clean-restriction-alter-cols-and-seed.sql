-- Clean restrictions table.
-- Clean the tables that has relation with restrictions table.
-- Clean federal_restrictions.
TRUNCATE TABLE sims.federal_restrictions RESTART IDENTITY CASCADE;

-- Clean institution_restrictions.
TRUNCATE TABLE sims.institution_restrictions RESTART IDENTITY CASCADE;

-- Clean student_restrictions.
TRUNCATE TABLE sims.student_restrictions RESTART IDENTITY CASCADE;

--Clean restrictions.
TRUNCATE TABLE sims.restrictions RESTART IDENTITY CASCADE;

-- Drop column allowed_count.
ALTER TABLE
  sims.restrictions DROP COLUMN allowed_count;

-- Add action_type to restrictions table.
ALTER TABLE
  sims.restrictions
ADD
  COLUMN IF NOT EXISTS action_type sims.restriction_action_types [] NOT NULL;

COMMENT ON COLUMN sims.restrictions.action_type IS 'Actions associated with the restriction, for instance, when a restriction must prevent the student from applying to a Student Application.';

-- Add notification_type to restrictions table.
ALTER TABLE
  sims.restrictions
ADD
  COLUMN IF NOT EXISTS notification_type sims.restriction_notification_types NOT NULL;

COMMENT ON COLUMN sims.restrictions.notification_type IS 'The type of notification for the restriction.';

-- Insert restrictions
INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    '4',
    'Student has been funded for 468 weeks or more and is nearing the lifetime maximum.',
    'Federal',
    ARRAY ['No effect'] :: sims.restriction_action_types [],
    'Warning'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    '5',
    'Student has been funded for 520 weeks and has reached the lifetime maximum.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    '6',
    'Student has been funded for 288 weeks or more and is nearing the lifetime maximum.',
    'Federal',
    ARRAY ['No effect'] :: sims.restriction_action_types [],
    'Warning'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    '7',
    'Student has been funded for 340 weeks and has reached the lifetime maximum.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    '8',
    'Student has been funded for 348 weeks or more and is nearing the lifetime maximum.',
    'Federal',
    ARRAY ['No effect'] :: sims.restriction_action_types [],
    'Warning'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    '9',
    'Student has been funded for 400 weeks and has reached the lifetime maximum.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    '12',
    'Student on scholastic standing denial due to multiple withdrawals or unsuccessful terms.',
    'Academic',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    'APPC',
    'Hold placed on file by Ministry user.',
    'Academic',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'No effect'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'AV',
    'Student has reached 17 week maximum for aviation program.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    'B3D',
    'BC portion of loan in default. Not eligible for BCSL. Eligible for CSL.',
    'BCSL Delinquency',
    ARRAY ['Stop BC funding'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'B6',
    'Bankruptcy restriction on file prevent CSL/BCSL disbursements.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    'B6A',
    'For reinstatment of your BCSL eligibility please complete an appeal.',
    'Other',
    ARRAY ['Stop BC funding'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'B9',
    'PD approved.',
    'Federal',
    ARRAY ['No effect'] :: sims.restriction_action_types [],
    'No effect'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'BF',
    'Risk Guranteed portfolios frozen.',
    'Federal',
    ARRAY ['No effect'] :: sims.restriction_action_types [],
    'Warning'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'C',
    'Federal restriction on file. No BCSL/CSL funding.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'TD',
    'Death.',
    'Federal',
    ARRAY ['Stop apply', 'Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'E2',
    'Student has declared bankruptcy on their application.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    'ECRS',
    'School reported early completion of studies.',
    'Academic',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'FC',
    'Student failed credit check resulting in denial.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'I',
    'Active.',
    'Federal',
    ARRAY ['No effect'] :: sims.restriction_action_types [],
    'No effect'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'N',
    'Bankruptcy where loans not included.',
    'Federal',
    ARRAY ['No effect'] :: sims.restriction_action_types [],
    'No effect'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    'NPWD',
    'Withdrawal converted to Non-Punitive and overawards removed.',
    'Academic',
    ARRAY ['No effect'] :: sims.restriction_action_types [],
    'No effect'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'O',
    'Please see overaward page for more info.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    'OVRD',
    'We have overriden the disbursement and this stays until the new amount goes out.',
    'Other',
    ARRAY ['No effect'] :: sims.restriction_action_types [],
    'No effect'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'P',
    'Convicted of an Offense related to Canada Student Loans.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'R',
    'Signifies that a Financial Institution (FI) has sent back a risk-shared loan to the federal government for further collection.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'RB',
    'Bankruptcy has been filed and there is a hold on federal and BC funding.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'RJ',
    'A judgement has been registered by CSFAP and student is not eligible for student loans.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'RP',
    'Student has been convicted of an offense and is not eligible for student loans.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

-- TODO: Action type enum does not have 'Stop full time', need to confirm.
-- INSERT INTO
--   sims.restrictions(
--     restriction_type,
--     restriction_code,
--     description,
--     restriction_category,
--     action_type,
--     notification_type
--   )
-- VALUES
--   (
--     'Provincial',
--     'SSR',
--     'Not eligible for full time funding due to scholastic standing must self fund or appeal.',
--     'Academic',
--     ARRAY ['Stop full time'] :: sims.restriction_action_types [],
--     'Error'
--   );
INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    'STRS',
    'Appendix 5 - Transfer pending ministry user review.',
    'Change',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'T',
    'CSLP has received a claim for loss request from a Financial institution but it has not yet been or is in the process of being audited/assessed.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    'UNCF',
    '52 weeks max funding for unclassified on submitted future app.',
    'Academic',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    'UNCL',
    '52 weeks maximum for unclassified studies reached. Denial of funding.',
    'Academic',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    'V',
    'Verification restriction on file. Set up call back for Student case review verification team.',
    'Verification',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'No effect'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'W',
    'Borrower missed one or more months of affordable RAP payments and has not made up the payment within 30 days.',
    'Federal',
    ARRAY ['Stop apply','Stop disbursement'] :: sims.restriction_action_types [],
    'No effect'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    'WTHD',
    'Student withdrew from studies.',
    'Academic',
    ARRAY ['No effect'] :: sims.restriction_action_types [],
    'No effect'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    'PTWTHD',
    'Student withdrew or was unsuccesful from Part Time studies.',
    'Academic',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'X',
    'Risk shared or direct loan is 90 days or more in arrears.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    'APLE',
    'Appeals hold placed on the account.',
    'Other',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'Z3',
    'Borrower on RAP.',
    'Federal',
    ARRAY ['Stop apply','Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'ZR',
    'Borrower has received RAP Stage 2.',
    'Federal',
    ARRAY ['Stop apply','Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    'AF',
    'False/Misleading Information.',
    'Verification',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'No effect'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    'AF4',
    'Dual Funding.',
    'Verification',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'No effect'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    'B2D',
    'BC portion of loan in delinquency. Not eligible for BCSL. Eligible for CSL.',
    'BCSL Delinquency',
    ARRAY ['Stop BC funding'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    'B6B',
    'Bankruptcy with no student loans included. Allowed to complete program.',
    'Other',
    ARRAY ['No effect'] :: sims.restriction_action_types [],
    'No effect'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'B7',
    'Student has been funded for 520 weeks and has reached the lifetime maximum.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'BO',
    'Student has been funded for 288 weeks or more and is nearing the lifetime maximum.',
    'Federal',
    ARRAY ['No effect'] :: sims.restriction_action_types [],
    'Warning'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'RD',
    'Active (Death).',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    'B1',
    'Due to withdrawal there is an overaward on your file that will be held from future funding.',
    'Other',
    ARRAY ['No effect'] :: sims.restriction_action_types [],
    'No effect'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'XB',
    'Altered Date.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'XD',
    'Altered Date - Direct Lend.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'XJ',
    'Judgement registered, input CSLP/Lender.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'XP',
    'Convicted of offense re CSL, CSLP/Lender.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'SA',
    'Stop All Assessment-See user for details.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'SO',
    'SOG Restriction - stop docs producing.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'SP',
    'Students with Permanent Disability.',
    'Federal',
    ARRAY ['No effect'] :: sims.restriction_action_types [],
    'No effect'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'IC',
    'ICP - Application on file.',
    'Federal',
    ARRAY ['No effect'] :: sims.restriction_action_types [],
    'Warning'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'IS',
    'ICP file - to Appeals for review.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'F3',
    'F1-5 restriction period varies from 1 - 5 years based on severity of the fraud.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'F4',
    'F1-5 restriction period varies from 1 - 5 years based on severity of the fraud.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'F5',
    'F1-5 restriction period varies from 1 - 5 years based on severity of the fraud.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'DR',
    'Document/Grant Cancel Received.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'B5',
    'Reached PD lifetime max.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'A',
    'Fed, near maximum, type A.',
    'Federal',
    ARRAY ['No effect'] :: sims.restriction_action_types [],
    'Warning'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'Z1',
    'Grant Overaward.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Federal',
    'Z2',
    'Grant/CMS Write-off.',
    'Federal',
    ARRAY ['Stop disbursement'] :: sims.restriction_action_types [],
    'Error'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    'B2',
    'BC portion of loan in default. Not eligible for BCSL. Eligible for CSL.',
    'BCSL Delinquency',
    ARRAY ['Stop BC funding'] :: sims.restriction_action_types [],
    'Error'
  );