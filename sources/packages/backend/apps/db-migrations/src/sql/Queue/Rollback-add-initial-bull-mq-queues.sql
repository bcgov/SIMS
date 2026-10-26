DELETE FROM
    sims.queue_configurations
WHERE
    queue_name IN (
        'event-queues.virus-scan',
        'schedulers.esdc.returned-loans-response-integration'
    );

ALTER TABLE
    sims.queue_configurations
ALTER COLUMN
    queue_settings
SET
    NOT NULL;