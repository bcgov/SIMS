-- Drop restriction_note_id
ALTER TABLE
    sims.student_restrictions DROP COLUMN IF EXISTS restriction_note_id;

-- Drop resolution_note_id
ALTER TABLE
    sims.student_restrictions DROP COLUMN IF EXISTS resolution_note_id;