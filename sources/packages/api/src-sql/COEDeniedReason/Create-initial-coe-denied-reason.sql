-- Inserting initial values for 'coe_denied_reason' table. This will be part of table creation migration. So, no drop migration sql, this data will destroy with table in drop migration
INSERT INTO
  coe_denied_reason(id, reason)
VALUES
  (1, 'Other');

INSERT INTO
  coe_denied_reason(id, reason)
VALUES
  (
    2,
    'School is unable to confirm student identity, please confirm your student number or contact Financial Student Aid Office for more information'
  );

INSERT INTO
  coe_denied_reason(id, reason)
VALUES
  (
    3,
    'Study period dates selected are incorrect, please submit an application for each semester individually'
  );

INSERT INTO
  coe_denied_reason(id, reason)
VALUES
  (
    4,
    'Study period dates are incorrect, please contact Financial Aid Office for more information'
  );

INSERT INTO
  coe_denied_reason(id, reason)
VALUES
  (
    5,
    'Programs you are registered in is not eligible for Student Aid BC funding, please contact Financial Aid Office for more information'
  );

INSERT INTO
  coe_denied_reason(id, reason)
VALUES
  (
    6,
    'Our records indicate you are not registered, please re-submit the application after registration'
  );