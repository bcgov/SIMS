-- Alter the type of created_at to have timezone.
ALTER TABLE
    sims.student_restrictions
ALTER COLUMN
    created_at TYPE timestamp with time zone;

-- Alter the type of updated_at to have timezone.
ALTER TABLE
    sims.student_restrictions
ALTER COLUMN
    updated_at TYPE timestamp with time zone;