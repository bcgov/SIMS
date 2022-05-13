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
    ARRAY ['No effect'] :: sims.restriction_action_type [],
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
    ARRAY ['Stop disbursement'] :: sims.restriction_action_type [],
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
    ARRAY ['No effect'] :: sims.restriction_action_type [],
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
    ARRAY ['Stop disbursement'] :: sims.restriction_action_type [],
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
    ARRAY ['No effect'] :: sims.restriction_action_type [],
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
    ARRAY ['Stop disbursement'] :: sims.restriction_action_type [],
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
    ARRAY ['Stop disbursement'] :: sims.restriction_action_type [],
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
    ARRAY ['Stop disbursement'] :: sims.restriction_action_type [],
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
    ARRAY ['Stop disbursement'] :: sims.restriction_action_type [],
    'Error'
  );