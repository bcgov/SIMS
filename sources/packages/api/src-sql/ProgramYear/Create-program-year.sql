CREATE TABLE IF NOT EXISTS program_year(
  id SERIAL PRIMARY KEY,
  program_year VARCHAR(100) NOT NULL,
  program_year_desc VARCHAR(250) NOT NULL,
  form_name VARCHAR(100) NOT NULL,
  active_indicator BOOLEAN NOT NULL DEFAULT TRUE,

  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL
);

-- Comments
COMMENT ON TABLE program_year IS 'Program Year table to manage students program year of the submitted application';

COMMENT ON COLUMN program_year.id IS 'Auto-generated sequential primary key column';

COMMENT ON COLUMN program_year.program_year IS 'Unique program year that defines the program year';

COMMENT ON COLUMN program_year.program_year_desc IS 'Description of the program year to be displayed in the initial application submit screen';

COMMENT ON COLUMN program_year.form_name IS 'Form to be loaded for a particular Program year';

COMMENT ON COLUMN program_year.active_indicator IS 'Indicator to check active status of program year';

COMMENT ON COLUMN program_year.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN program_year.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN program_year.creator IS 'Creator of the record. Null specified the record is created by system';

COMMENT ON COLUMN program_year.modifier IS 'Modifier of the record. Null specified the record is modified by system';