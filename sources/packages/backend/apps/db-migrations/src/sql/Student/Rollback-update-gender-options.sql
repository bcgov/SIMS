UPDATE
  sims.students
SET
  gender = 'male'
WHERE
  gender = 'man';

UPDATE
  sims.students
SET
  gender = 'X'
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
  gender = preferNotToAnswer
WHERE
  gender IS NULL;