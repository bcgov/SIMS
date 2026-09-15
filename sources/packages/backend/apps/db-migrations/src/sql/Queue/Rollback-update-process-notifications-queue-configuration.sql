UPDATE
    sims.queue_configurations
SET
    queue_configuration = '{
        "dashboardReadonly": false,
        "cron": "* * * * *",
        "cleanUpPeriod": 1800000,
        "pollingRecordLimit": 100
    }' :: json
WHERE
    queue_name = 'process-notifications';
