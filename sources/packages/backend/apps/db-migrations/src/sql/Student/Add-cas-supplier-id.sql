ALTER TABLE
  sims.students
ADD
  COLUMN cas_supplier_id INT NULL DEFAULT NULL REFERENCES sims.cas_suppliers(id);

COMMENT ON COLUMN sims.students.cas_supplier_id IS 'Reference to the CAS supplier id.';