CREATE TABLE IF NOT EXISTS sims.designation_agreement_locations (
  location_id INT REFERENCES sims.institution_locations(id) NOT NULL,
  designation_agreement_id INT REFERENCES sims.designation_agreements(id) NOT NULL,
  
  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  creator INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE SET NULL,
  PRIMARY KEY(location_id, designation_agreement_id)
);