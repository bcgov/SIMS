ALTER TABLE
    sims.cas_suppliers
ADD
    COLUMN errors VARCHAR(300) [];

COMMENT ON COLUMN sims.cas_suppliers.errors IS 'Errors received from CAS.';