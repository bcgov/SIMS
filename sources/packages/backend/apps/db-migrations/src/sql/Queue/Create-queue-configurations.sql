-- Create new table queue_configurations.
CREATE TABLE IF NOT EXISTS sims.queue_configurations(
  id SERIAL PRIMARY KEY,
  queue_name VARCHAR(100) UNIQUE NOT NULL,
  queue_configuration jsonb NOT NULL
);

-- ## Comments
COMMENT ON TABLE sims.queue_configurations IS 'The table that holds the queue configurations.';

COMMENT ON COLUMN sims.queue_configurations.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.queue_configurations.queue_name IS 'Hold the queue name.';

COMMENT ON COLUMN sims.queue_configurations.queue_configuration IS 'Contains the queue configuration.';