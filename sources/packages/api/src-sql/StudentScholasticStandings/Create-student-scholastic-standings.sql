CREATE TABLE IF NOT EXISTS sims.student_scholastic_standings (
  id SERIAL PRIMARY KEY,
  submitted_data jsonb NOT NULL,
  approved_data jsonb NOT NULL,
  application_id INT NOT NULL REFERENCES sims.applications(id) ON DELETE CASCADE,
  scholastic_standing_status sims.scholastic_standing_status NOT NULL,
  assessed_date TIMESTAMP WITH TIME ZONE,
  assessed_by INT REFERENCES sims.users(id) ON DELETE
  SET
    NULL,
    note_id INT REFERENCES sims.notes(id) ON DELETE
  SET
    NULL,
    -- Audit columns
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE
  SET
    NULL,
    modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE
  SET
    NULL
);