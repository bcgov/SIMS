
-- Add the column application_number for application.
ALTER TABLE applications ADD 
    COLUMN IF NOT EXISTS application_number VARCHAR(10);

-- ## Comments
COMMENT ON COLUMN applications.application_number IS 'Unique 10 digit application number';
