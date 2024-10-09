CREATE TABLE sims.sfas_bridge_log(
    id SERIAL PRIMARY KEY,
    reference_date TIMESTAMP WITH TIME ZONE NOT NULL,
    generated_file_name VARCHAR(50) NOT NULL,
    -- Audit columns (only created columns added as it is never expected to receive an update).
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creator INT NULL DEFAULT NULL REFERENCES sims.users(id)
);

-- ## Comments
COMMENT ON TABLE sims.sfas_bridge_log IS 'Log the details of every file generation from SIMS to SFAS.';

COMMENT ON COLUMN sims.sfas_bridge_log.id IS 'Auto-generated sequential primary key column';

COMMENT ON COLUMN sims.sfas_bridge_log.reference_date IS 'Timestamp when the file data was extracted.';

COMMENT ON COLUMN sims.sfas_bridge_log.generated_file_name IS 'Generated bridge file name.';

COMMENT ON COLUMN sims.sfas_bridge_log.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.sfas_bridge_log.creator IS 'Creator of the record.';