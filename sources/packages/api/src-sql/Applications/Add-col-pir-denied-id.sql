-- Create pir_denied_id 
ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS pir_denied_id INT REFERENCES sims.pir_denied_reason(id);

COMMENT ON COLUMN sims.applications.pir_denied_id IS 'References the PIR denied id related to the application, this will be populated only when the Institution denies a PIR ';

-- Create pir_denied_other_desc
ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS pir_denied_other_desc VARCHAR(500);

COMMENT ON COLUMN sims.applications.pir_denied_other_desc IS 'When PIR denied reason is other, the Institution user has to input an associated reson, this column will contain the reason text';