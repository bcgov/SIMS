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

-- Drop column action_type.
ALTER TABLE
  sims.restrictions DROP COLUMN action_type;

-- Drop column notification_type.
ALTER TABLE
  sims.restrictions DROP COLUMN notification_type;

-- Add column allowed_count.
ALTER TABLE
  sims.restrictions
ADD
  COLUMN IF NOT EXISTS allowed_count INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN sims.restrictions.allowed_count IS 'Allowed count defines the maximum number of times a given restriction can be held by any user';

-- Insert old restrictions data to the sims.restrictions table.
INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category
  )
VALUES
  (
    'Federal',
    '4',
    '# of weeks >= 468, input by CSLP',
    'Federal'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category
  )
VALUES
  (
    'Federal',
    '5',
    '# of weeks >= 520, input by CSLP',
    'Federal'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category
  )
VALUES
  (
    'Federal',
    '6',
    '# of weeks >= 288, input by CSLP',
    'Federal'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category
  )
VALUES
  (
    'Federal',
    '7',
    '# of weeks >= 340, input by CSLP',
    'Federal'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category
  )
VALUES
  (
    'Federal',
    'A',
    'Fed, near maximum, Type A',
    'Federal'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category
  )
VALUES
  (
    'Federal',
    'BO',
    'Federal, near maximum, Type B',
    'Federal'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category
  )
VALUES
  (
    'Federal',
    'C',
    'Standard claim, input by CSLP',
    'Federal'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category
  )
VALUES
  (
    'Federal',
    'D',
    'Death (History Code)',
    'Federal'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category
  )
VALUES
  (
    'Federal',
    'I',
    'Permanent disability, input by CSLP',
    'Federal'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category
  )
VALUES
  (
    'Federal',
    'O',
    'Students has rec''d O/A-input by Province',
    'Federal'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category
  )
VALUES
  (
    'Federal',
    'R',
    'Put-back (R/S Loan)rec''d/paid , Input  CSLP',
    'Federal'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category
  )
VALUES
  (
    'Federal',
    'RB',
    'Bankrupcy filed, input by CSLP or Lender',
    'Federal'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category
  )
VALUES
  (
    'Federal',
    'RD',
    'Death, input by CSLP or Lender',
    'Federal'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category
  )
VALUES
  (
    'Federal',
    'RJ',
    'Judgement registered, input CSLP/Lender',
    'Federal'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category
  )
VALUES
  (
    'Federal',
    'RP',
    'Convicted of offense re CSL, CSLP/Lender',
    'Federal'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category
  )
VALUES
  (
    'Federal',
    'T',
    'Temp. claim, rec''d/not paid, Input CSLP',
    'Federal'
  );

INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category
  )
VALUES
  (
    'Federal',
    'X',
    'R/S Loan 90 days in arrears, Input Lender',
    'Federal'
  );