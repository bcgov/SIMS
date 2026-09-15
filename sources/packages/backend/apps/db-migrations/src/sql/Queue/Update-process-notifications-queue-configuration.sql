UPDATE
    sims.queue_configurations
SET
    queue_configuration = '{
        "dashboardReadonly": false,
        "cron": "*/30 * * * * *",
        "cleanUpPeriod": 1800000,
        "pollingRecordLimit": 100,
        "externalRateLimit": 490,
        "externalRateLimitSeconds": 60
    }' :: json
WHERE
    queue_name = 'process-notifications';