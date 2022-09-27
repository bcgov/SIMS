-- Add coe_denied_id 
ALTER TABLE
    sims.disbursement_schedules
ADD
    COLUMN IF NOT EXISTS coe_denied_id INT REFERENCES sims.coe_denied_reasons(id);

COMMENT ON COLUMN sims.disbursement_schedules.coe_denied_id IS 'References the COE denied reason related to the disbursement schedule, this will be populated only when the Institution denies a COE. ';

-- Add coe_denied_other_desc
ALTER TABLE
    sims.disbursement_schedules
ADD
    COLUMN IF NOT EXISTS coe_denied_other_desc VARCHAR(500);

COMMENT ON COLUMN sims.disbursement_schedules.coe_denied_other_desc IS 'When COE denied reason is other, the Institution user has to input an associated reason, this column will contain the reason text.';