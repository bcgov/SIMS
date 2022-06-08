--Create table sims.disbursement_receipt_values.
CREATE TABLE IF NOT EXISTS sims.disbursement_receipt_values(
    id SERIAL PRIMARY KEY,
    disbursement_receipt_id INT NOT NULL REFERENCES sims.disbursement_receipts(id),
    grant_type VARCHAR(6) NOT NULL,
    grant_mount NUMERIC(5) NOT NULL,
    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    creator INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
    SET
        NULL,
        modifier INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
    SET
        NULL
);

-- ## Comments
COMMENT ON TABLE sims.disbursement_receipt_values IS 'Grants(Both federal and provincial) which belong to a disbursement receipt.';

COMMENT ON COLUMN sims.disbursement_receipt_values.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.disbursement_receipt_values.disbursement_receipt_id IS 'Related disbursement receipt entry.';

COMMENT ON COLUMN sims.disbursement_receipt_values.grant_type IS 'Federal or Provincial grant type.';

COMMENT ON COLUMN sims.disbursement_receipt_values.grant_mount IS 'Grant amount.';

COMMENT ON COLUMN sims.disbursement_receipt_values.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN sims.disbursement_receipt_values.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN sims.disbursement_receipt_values.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.disbursement_receipt_values.modifier IS 'Modifier of the record.';