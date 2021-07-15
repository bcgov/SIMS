
-- Add the column pd_date_sent for PD.
ALTER TABLE students ADD 
    COLUMN IF NOT EXISTS pd_date_sent  timestamp without time zone;
COMMENT ON COLUMN students.pd_date_sent IS 'Student profile create in ATBC at';

-- Add the column pd_date_update for PD.
ALTER TABLE students ADD 
    COLUMN IF NOT EXISTS pd_date_update  timestamp without time zone;
COMMENT ON COLUMN students.pd_date_update IS 'Permanent Disability status updated at';

-- Add the column pd_status for PD sttaus from ATBC.
ALTER TABLE students ADD 
    COLUMN IF NOT EXISTS pd_status  BOOLEAN;
COMMENT ON COLUMN students.pd_status IS 'Permanent Disability status from ATBC';

