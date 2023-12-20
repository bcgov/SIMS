-- Updating the queue-configurations table to rollback disabling the atbc-response-integration queue  --
UPDATE
  sims.queue_configurations
SET
  is_active = true
where
  queue_name = 'atbc-response-integration';