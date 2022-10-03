--Adding COE columns for rollback.
ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS coe_status sims.coe_status;

COMMENT ON COLUMN sims.applications.coe_status IS 'Column which indicates the COE Status of an application.';

ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS coe_denied_id INT REFERENCES sims.coe_denied_reasons(id);

COMMENT ON COLUMN sims.applications.coe_denied_id IS 'References the COE denied id related to the application, this will be populated only when the Institution denies a COE ';

ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS coe_denied_other_desc VARCHAR(500);

COMMENT ON COLUMN sims.applications.coe_denied_other_desc IS 'When COE denied reason is other, the Institution user has to input an associated reason, this column will contain the reason text';