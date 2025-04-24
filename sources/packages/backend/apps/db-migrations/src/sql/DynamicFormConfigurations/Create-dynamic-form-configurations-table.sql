CREATE TABLE sims.dynamic_form_configurations(
    id SERIAL PRIMARY KEY,
    form_type VARCHAR(100) NOT NULL,
    program_year_id INT REFERENCES sims.program_years(id),
    offering_intensity sims.offering_intensity,
    form_definition_name VARCHAR(100) NOT NULL,
    -- Audit columns.
    -- Creator and modifier are not provided as the configurations cannot by created or updated by application users.
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT form_type_program_year_offering_intensity_unique UNIQUE (form_type, program_year_id, offering_intensity)
);

-- Comments.
COMMENT ON TABLE sims.dynamic_form_configurations IS 'Dynamic form configurations based on form type.';

COMMENT ON COLUMN sims.dynamic_form_configurations.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.dynamic_form_configurations.form_type IS 'Form type which is dynamically configured.';

COMMENT ON COLUMN sims.dynamic_form_configurations.program_year_id IS 'Program year to identify the dynamic form for the form type.';

COMMENT ON COLUMN sims.dynamic_form_configurations.offering_intensity IS 'Offering intensity to identify the dynamic form for the form type.';

COMMENT ON COLUMN sims.dynamic_form_configurations.form_definition_name IS 'Form definition for the form type based on configurations.';

COMMENT ON COLUMN sims.dynamic_form_configurations.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.dynamic_form_configurations.updated_at IS 'Record update timestamp.';

COMMENT ON CONSTRAINT form_type_program_year_offering_intensity_unique ON sims.dynamic_form_configurations IS 'Ensure that configuration is unique based on form type, program year and offering intensity.';