CREATE TABLE IF NOT EXISTS sims.federal_restrictions (
    id BIGSERIAL PRIMARY KEY,
    last_name VARCHAR(100) NOT NULL,
    sin CHAR(9) NOT NULL,
    birth_date DATE NOT NULL,
    restriction_id INT NOT NULL,
    student_id INT,
    -- Audit columns
    created_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE INDEX lower_last_name_sin_birth_date ON sims.federal_restrictions(lower(last_name), sin, birth_date);

CREATE INDEX student_id_restriction_id ON sims.federal_restrictions(student_id, restriction_id);

-- Comments for table and column
COMMENT ON TABLE sims.federal_restrictions IS 'Represents the current snapshot of all federal restrictions currently active.';

COMMENT ON COLUMN sims.federal_restrictions.id IS 'Auto-generated sequential primary key column';

COMMENT ON COLUMN sims.federal_restrictions.last_name IS 'Last name of the student.';

COMMENT ON COLUMN sims.federal_restrictions.sin IS 'SIN of the student.';

COMMENT ON COLUMN sims.federal_restrictions.birth_date IS 'Date of birth of the student.';

COMMENT ON COLUMN sims.federal_restrictions.restriction_id IS 'Restriction associated with federal record.';

COMMENT ON COLUMN sims.federal_restrictions.created_at IS 'Record creation timestamp.';