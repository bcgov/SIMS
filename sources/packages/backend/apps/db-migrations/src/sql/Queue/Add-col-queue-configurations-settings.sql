-- Add the new column 'settings' using the expected default configuration.
ALTER TABLE
  sims.queue_configurations
ADD
  COLUMN queue_settings JSONB NOT NULL DEFAULT '{ "maxStalledCount": 0, "lockDuration": 60000, "lockRenewTime": 5000 }' :: JSONB;

-- Drop the default to force the new queues to re-evaluated if the configuration is the right one for the new queue.
ALTER TABLE
  sims.queue_configurations
ALTER COLUMN
  queue_settings DROP DEFAULT;

COMMENT ON COLUMN sims.queue_configurations.queue_settings IS 'Represents advanced settings to control additional queue behavior.';