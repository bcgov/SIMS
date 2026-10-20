DELETE FROM
    sims.queue_configurations
WHERE
    queue_name IN (
        'virus-scan-v2',
        'returned-loans-response-integration-v2'
    );

ALTER TABLE
    sims.queue_configurations
ALTER COLUMN
    queue_settings
SET
    NOT NULL;