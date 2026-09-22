CREATE TABLE sims.education_programs_configurations (
    id SERIAL PRIMARY KEY,
    visual_schema JSONB NOT NULL,
    validation_schema JSONB NOT NULL,
    program_year_id INT REFERENCES sims.program_years(id) NOT NULL,
    is_active BOOLEAN NOT NULL,
    -- Audit columns.
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Ensures only one active configuration exists per program year.
CREATE UNIQUE INDEX education_programs_configurations_unique_active_per_program_year ON sims.education_programs_configurations(program_year_id)
WHERE
    is_active;

COMMENT ON INDEX sims.education_programs_configurations_unique_active_per_program_year IS 'Enforces that only one active configuration can exist for a program year at any given time.';