-- Rollback the type of created_at to remove timezone.
ALTER TABLE
    sims.student_restrictions
ALTER COLUMN
    created_at TYPE timestamp without time zone;

-- Rollback the type of updated_at to remove timezone.
ALTER TABLE
    sims.student_restrictions
ALTER COLUMN
    updated_at TYPE timestamp without time zone;