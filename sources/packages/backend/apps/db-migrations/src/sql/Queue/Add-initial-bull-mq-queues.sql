-- Bull mq queues does not use the queue_settings column.
-- TODO: After bull mq migration, the queue_settings column can be dropped.
ALTER TABLE
    sims.queue_configurations
ALTER COLUMN
    queue_settings DROP NOT NULL;

INSERT INTO
    queue_configurations(queue_name, queue_configuration)
VALUES
    (
        'virus-scan-v2',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 604800
                }
            },
            "dashboardReadonly": false
        }
        $json$ :: json
    );

-- The scheduler is set to run at 8 a.m. PCT every day.
INSERT INTO
    sims.queue_configurations(queue_name, queue_configuration)
VALUES
    (
        'returned-loans-response-integration-v2',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {"pattern":"0 8 * * *", "tz": "America/Vancouver"},
            "dashboardReadonly": false
        }
        $json$ :: jsonb
    );