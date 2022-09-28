CREATE TABLE IF NOT EXISTS program_years(
  id SERIAL PRIMARY KEY,
  program_year VARCHAR(100) NOT NULL,
  program_year_desc VARCHAR(250) NOT NULL,
  form_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Constraint
  CONSTRAINT uc_program_year_form_name_202107150001 UNIQUE (program_year,form_name)
);

-- Comments
COMMENT ON TABLE program_years IS 'Program Year table to manage students program year of the application';

COMMENT ON COLUMN program_years.id IS 'Auto-generated sequential primary key column';

COMMENT ON COLUMN program_years.program_year IS 'Unique program year that defines the program year';

COMMENT ON COLUMN program_years.program_year_desc IS 'Description of the program year to be displayed in the initial application submit screen';

COMMENT ON COLUMN program_years.form_name IS 'Form to be loaded for a particular Program year';

COMMENT ON COLUMN program_years.is_active IS 'Indicator to check active status of program year';

COMMENT ON COLUMN program_years.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN program_years.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN program_years.creator IS 'Creator of the record. Null specified the record is created by system';

COMMENT ON COLUMN program_years.modifier IS 'Modifier of the record. Null specified the record is modified by system';