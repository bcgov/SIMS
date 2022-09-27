-- Rollback program status type to varchar
ALTER TABLE
    sims.education_programs
ALTER COLUMN
    program_status TYPE VARCHAR(50);