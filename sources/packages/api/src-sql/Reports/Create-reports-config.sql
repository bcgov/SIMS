--Create table sims.report_configs
CREATE TABLE IF NOT EXISTS sims.report_configs(
    id SERIAL PRIMARY KEY,
    report_name VARCHAR(100) UNIQUE NOT NULL,
    report_sql TEXT NOT NULL,
    -- Audit columns
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE
    SET
        NULL,
        modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE
    SET
        NULL
);

-- Comments for table and column
COMMENT ON TABLE sims.report_configs IS 'Config table that holds the dynamic sql of reports.';

COMMENT ON COLUMN sims.report_configs.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.report_configs.report_name IS 'Unique report name that refers to a report.';

COMMENT ON COLUMN sims.report_configs.report_sql IS 'SQL of a report.';

COMMENT ON COLUMN sims.report_configs.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN sims.report_configs.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN sims.report_configs.creator IS 'Creator of the record. Null specified the record is created by system';

COMMENT ON COLUMN sims.report_configs.modifier IS 'Modifier of the record. Null specified the record is modified by system';