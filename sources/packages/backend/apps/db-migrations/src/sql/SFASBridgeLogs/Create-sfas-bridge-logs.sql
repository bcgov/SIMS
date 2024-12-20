CREATE TABLE sims.sfas_bridge_logs(
    id SERIAL PRIMARY KEY,
    reference_date TIMESTAMP WITH TIME ZONE NOT NULL,
    generated_file_name VARCHAR(50) NOT NULL,
    -- Audit columns (only created_at is added as it is never expected to receive an update or multiple creators).
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ## Comments
COMMENT ON TABLE sims.sfas_bridge_logs IS 'Log the details of every bridge file generation from SIMS to SFAS.';

COMMENT ON COLUMN sims.sfas_bridge_logs.id IS 'Auto-generated sequential primary key column';

COMMENT ON COLUMN sims.sfas_bridge_logs.reference_date IS 'Timestamp when the bridge file data was extracted.';

COMMENT ON COLUMN sims.sfas_bridge_logs.generated_file_name IS 'Generated bridge file name.';

COMMENT ON COLUMN sims.sfas_bridge_logs.created_at IS 'Record creation timestamp.';