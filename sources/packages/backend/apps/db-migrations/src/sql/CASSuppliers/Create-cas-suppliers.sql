CREATE TABLE sims.cas_suppliers(
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES sims.students(id),
  supplier_number VARCHAR(100) NULL,
  supplier_name VARCHAR(100) NULL,
  status VARCHAR(50) NULL,
  supplier_protected BOOLEAN NULL,
  last_updated TIMESTAMP WITH TIME ZONE NULL,
  supplier_address JSONB,
  supplier_status sims.supplier_status,
  supplier_status_updated_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_valid BOOLEAN NOT NULL DEFAULT FALSE,
  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  creator INT NULL DEFAULT NULL REFERENCES sims.users(id),
  modifier INT NULL DEFAULT NULL REFERENCES sims.users(id)
);

-- ## Comments
COMMENT ON TABLE sims.cas_suppliers IS 'Student supplier information data from the integration with Corporate Accounting System (CAS).';

COMMENT ON COLUMN sims.cas_suppliers.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.cas_suppliers.student_id IS 'Reference to student id in students table.';

COMMENT ON COLUMN sims.cas_suppliers.supplier_number IS 'Supplier number received from CAS. null when no data was ever retrieved from CAS.';

COMMENT ON COLUMN sims.cas_suppliers.supplier_name IS 'Supplier name received from CAS. null when no data was ever retrieved from CAS.';

COMMENT ON COLUMN sims.cas_suppliers.status IS 'Supplier status received from CAS. null when no data was ever retrieved from CAS.';

COMMENT ON COLUMN sims.cas_suppliers.supplier_protected IS 'Protected flag received from CAS which means the student profile was created by SFAS and therefore no system other than SFAS can change it. null when no data was ever retrieved from CAS.';

COMMENT ON COLUMN sims.cas_suppliers.last_updated IS 'Date and time of the last update. null when no data was ever retrieved from CAS.';

COMMENT ON COLUMN sims.cas_suppliers.supplier_address IS 'Supplier address from the CAS integrations.';

COMMENT ON COLUMN sims.cas_suppliers.supplier_status IS 'Indicates if the system should execute verification in the record calling some of the CAS integrations; if the record represents manual entry and no actions are needed; or if no further verifications are needed.';

COMMENT ON COLUMN sims.cas_suppliers.supplier_status_updated_on IS 'Date when the column supplier_status was updated.';

COMMENT ON COLUMN sims.cas_suppliers.is_valid IS 'Indicates when the supplier is considered valid and an invoice can be generated using the information.';

COMMENT ON COLUMN sims.cas_suppliers.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.cas_suppliers.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.cas_suppliers.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.cas_suppliers.modifier IS 'Modifier of the record.';