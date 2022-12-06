-- Create new table queue_configurations.
CREATE TABLE IF NOT EXISTS queue_configurations(
  id SERIAL PRIMARY KEY,
  queue_name VARCHAR(100) UNIQUE NOT NULL,
  queue_configuration jsonb NOT NULL,
  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE
  SET
    NULL,
    modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE
  SET
    NULL
);

-- ## Comments
COMMENT ON TABLE sims.queue_configurations IS 'The table that holds the queue configurations.';

COMMENT ON COLUMN sims.queue_configurations.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.queue_configurations.queue_name IS 'Hold the queue name.';

COMMENT ON COLUMN sims.queue_configurations.queue_configuration IS 'Contains the queue configuration.';

COMMENT ON COLUMN sims.queue_configurations.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN sims.queue_configurations.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN sims.queue_configurations.creator IS 'Creator of the record. Null specified the record is created by system';

COMMENT ON COLUMN sims.queue_configurations.modifier IS 'Modifier of the record. Null specified the record is modified by system';