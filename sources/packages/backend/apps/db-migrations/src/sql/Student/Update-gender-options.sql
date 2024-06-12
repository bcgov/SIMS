ALTER TABLE
  sims.students
ALTER COLUMN
  gender TYPE varchar(50);

UPDATE
  sims.students
SET
  gender = 'man'
WHERE
  gender = 'male';

UPDATE
  sims.students
SET
  gender = 'nonBinary'
WHERE
  gender = 'X';

UPDATE
  sims.students
SET
  gender = 'woman'
WHERE
  gender = 'female';

UPDATE
  sims.students
SET
  gender = 'preferNotToAnswer'
WHERE
  gender = 'unknown';