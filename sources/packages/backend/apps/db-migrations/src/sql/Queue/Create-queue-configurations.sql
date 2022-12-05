-- Create new table queue_configurations.
CREATE TABLE IF NOT EXISTS queue_configurations(
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  configuration jsonb NOT NULL
);

-- ## Comments
COMMENT ON TABLE sims.queue_configurations IS 'The table that holds the queue configurations.';

COMMENT ON COLUMN sims.queue_configurations.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.queue_configurations.name IS 'Hold the queue name.';

COMMENT ON COLUMN sims.queue_configurations.configuration IS 'Contains the queue configuration.';