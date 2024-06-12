UPDATE
  sims.students
SET
  gender = 'male'
WHERE
  gender = 'man';

UPDATE
  sims.students
SET
  gender = 'diverse'
WHERE
  gender = 'nonBinary';

UPDATE
  sims.students
SET
  gender = 'female'
WHERE
  gender = 'woman';

UPDATE
  sims.students
SET
  gender = 'unknown'
WHERE
  gender = 'preferNotToAnswer';

ALTER TABLE
  sims.students
ALTER COLUMN
  gender TYPE varchar(10);