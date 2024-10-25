UPDATE
  sims.sin_validations
SET
  gender_sent = NULL
WHERE
  LENGTH(gender_sent) > 10;

ALTER TABLE
  sims.sin_validations
ALTER COLUMN
  gender_sent TYPE VARCHAR(10);