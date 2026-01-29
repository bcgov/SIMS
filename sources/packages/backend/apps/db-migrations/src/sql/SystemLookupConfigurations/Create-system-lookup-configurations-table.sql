CREATE TABLE sims.system_lookup_configurations(
    id SERIAL PRIMARY KEY,
    lookup_category VARCHAR(100) NOT NULL,
    lookup_key VARCHAR(100) NOT NULL,
    lookup_value VARCHAR(500) NOT NULL,
    -- Audit columns.
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creator INT NOT NULL REFERENCES sims.users(id),
    modifier INT NULL DEFAULT NULL REFERENCES sims.users(id),
    CONSTRAINT lookup_category_key_value_unique UNIQUE (lookup_category, lookup_key, lookup_value)
);

-- Comments.
COMMENT ON TABLE sims.system_lookup_configurations IS 'System lookup configurations to store lookup data based on lookup category.';

COMMENT ON COLUMN sims.system_lookup_configurations.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.system_lookup_configurations.lookup_category IS 'Lookup category of a lookup data.';

COMMENT ON COLUMN sims.system_lookup_configurations.lookup_key IS 'Lookup key of a lookup data.';

COMMENT ON COLUMN sims.system_lookup_configurations.lookup_value IS 'Lookup value of a lookup data.';

COMMENT ON COLUMN sims.system_lookup_configurations.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.system_lookup_configurations.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.system_lookup_configurations.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.system_lookup_configurations.modifier IS 'Modifier of the record.';

COMMENT ON CONSTRAINT lookup_category_key_value_unique ON sims.system_lookup_configurations IS 'Ensure that configuration is unique based on lookup category, lookup key and lookup value.';