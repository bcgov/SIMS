-- Dropping the not null constraint as sims.students and sims.sin_validations are dependant on each other and
-- due to this dependency both the records cannot be inserted in the same transaction and also if there is any need
-- to clean up any of these table it cannot be done due to this cyclic dependency.
ALTER TABLE
    sims.students
ALTER COLUMN
    sin_validation_id DROP NOT NULL;