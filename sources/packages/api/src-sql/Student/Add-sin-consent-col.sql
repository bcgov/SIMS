ALTER TABLE
    sims.students
ADD
    COLUMN IF NOT EXISTS sin_consent BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN sims.students.sin_consent IS 'Indicates consent of the student to terms and conditions of the studentAid BC declaration of SIN.';