-- Alter table to create sin_validation_id to have null column --
ALTER TABLE
    sims.students
ADD
    COLUMN IF NOT EXISTS sin_validation_id INT REFERENCES sims.sin_validations(id);

COMMENT ON COLUMN sims.students.sin_validation_id IS 'SIN validation record that indicates the current SIN validation status of this student.';

-- Inserting the placeholder records in SIN_VALIDATIONS table for the users_id in student table --

INSERT INTO SIMS.SIN_VALIDATIONS (USER_ID)
	(SELECT USER_ID
		FROM SIMS.STUDENTS);

-- Updating the students table with sin_validation_id from the newly created columns mapping the user_id  --

UPDATE SIMS.STUDENTS
SET SIN_VALIDATION_ID =
	(SELECT ID
		FROM SIMS.SIN_VALIDATIONS
		WHERE USER_ID = SIMS.STUDENTS.USER_ID);

-- Set the NOT NULL constraint on sin_validation_id --
ALTER TABLE
  sims.STUDENTS
ALTER COLUMN
  sin_validation_id
SET
  NOT NULL;
