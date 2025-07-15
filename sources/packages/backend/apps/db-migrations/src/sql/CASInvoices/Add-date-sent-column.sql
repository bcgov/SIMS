ALTER TABLE
    sims.cas_invoices
ADD
    COLUMN date_sent TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN sims.cas_invoices.date_sent IS 'Date and time when the invoice was sent to CAS.';

-- Update the date_sent for existing sent invoices.
UPDATE
    sims.cas_invoices
SET
    date_sent = invoice_status_updated_on
WHERE
    invoice_status = 'Sent';