-- Drop restriction_note
ALTER TABLE
    sims.student_restrictions DROP COLUMN IF EXISTS restriction_note;

-- Drop resolution_note
ALTER TABLE
    sims.student_restrictions DROP COLUMN IF EXISTS resolution_note;