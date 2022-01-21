CREATE TABLE IF NOT EXISTS sims.designation_agreements (
  id SERIAL PRIMARY KEY,
  institution_id INT REFERENCES sims.institutions(id) ON DELETE CASCADE NOT NULL,
  submitted_data jsonb NOT NULL,
  designation_status sims.designation_agreement_status NOT NULL,
  submitted_by INT NOT NULL REFERENCES sims.users(id) ON DELETE SET NULL,
  submitted_date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_date DATE,
  end_date DATE,
  approved_by INT REFERENCES sims.users(id) ON DELETE SET NULL,
  approved_date TIMESTAMP WITH TIME ZONE,
   
  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  creator INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE SET NULL
);