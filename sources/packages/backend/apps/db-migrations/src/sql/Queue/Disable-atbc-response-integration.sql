-- TODO: This is disabled as part of #2539 - Suspend any ATBC integration.
-- Updating the queue-configurations table to disable atbc-response-integration queue  --
UPDATE
    sims.queue_configurations
SET
    is_active = false
where
    queue_name = 'atbc-response-integration';