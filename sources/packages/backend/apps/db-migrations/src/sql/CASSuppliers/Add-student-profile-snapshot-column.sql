ALTER TABLE
    sims.cas_suppliers
ADD
    COLUMN student_profile_snapshot jsonb;

COMMENT ON COLUMN sims.cas_suppliers.student_profile_snapshot IS 'Snapshot of the student profile details which is captured when the CAS supplier is set to be valid.';