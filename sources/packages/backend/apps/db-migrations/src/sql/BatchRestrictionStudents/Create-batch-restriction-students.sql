CREATE TABLE sims.batch_restriction_students (
    id SERIAL PRIMARY KEY,
    batch_restriction_id INT NOT NULL REFERENCES sims.batch_restrictions(id),
    application_number CHAR(10) NOT NULL,
    student_id INT REFERENCES sims.students(id),
    failure_reason VARCHAR(250),
    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creator INT NOT NULL DEFAULT NULL REFERENCES sims.users(id),
    modifier INT NULL DEFAULT NULL REFERENCES sims.users(id)
);

CREATE INDEX batch_restriction_students_batch_restriction_id ON sims.batch_restriction_students(batch_restriction_id);

-- ## Comments
COMMENT ON TABLE sims.batch_restriction_students IS 'Application number included in a batch restriction submission and the student it belongs to.';

COMMENT ON COLUMN sims.batch_restriction_students.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.batch_restriction_students.batch_restriction_id IS 'Batch restriction submission that included this application number.';

COMMENT ON COLUMN sims.batch_restriction_students.application_number IS 'Application number submitted to find the student.';

COMMENT ON COLUMN sims.batch_restriction_students.student_id IS 'Student of the application number. Null when the application number does not exist.';

COMMENT ON COLUMN sims.batch_restriction_students.failure_reason IS 'Reason the restriction could not be added to the student. Null when the student has the restriction active.';

COMMENT ON COLUMN sims.batch_restriction_students.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.batch_restriction_students.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.batch_restriction_students.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.batch_restriction_students.modifier IS 'Modifier of the record.';
