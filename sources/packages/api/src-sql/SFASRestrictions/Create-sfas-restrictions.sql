CREATE TABLE IF NOT EXISTS sims.sfas_restrictions (
  id INT PRIMARY KEY,
  individual_id INT NOT NULL,
  code VARCHAR(4) NOT NULL,
  effective_date DATE NOT NULL,
  removal_date DATE,
  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  extracted_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX sfas_restrictions_individual_id ON sims.sfas_restrictions(individual_id);

-- ## Comments
COMMENT ON TABLE sims.sfas_restrictions IS 'These records contain data related to an individual/student in SFAS.';

COMMENT ON COLUMN sims.sfas_restrictions.id IS 'Unique identifier from SFAS.';

COMMENT ON COLUMN sims.sfas_restrictions.individual_id IS 'The unique key/number used in SFAS to identify this individual (individual.individual_idx).';

COMMENT ON COLUMN sims.sfas_restrictions.code IS 'Restriction code (individual_process_control.control_reason_cde).';

COMMENT ON COLUMN sims.sfas_restrictions.effective_date IS 'Date that this restriction is considered effective (individual_process_control.control_effective_dte).';

COMMENT ON COLUMN sims.sfas_restrictions.removal_date IS 'Date that this restriction is considered removed and no longer in effect individual_process_control.control_removed_dte (date).';

-- Audit columns
COMMENT ON COLUMN sims.sfas_restrictions.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.sfas_restrictions.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.sfas_restrictions.extracted_at IS 'Date that the record was extracted from SFAS.';