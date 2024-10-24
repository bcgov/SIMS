UPDATE
    sims.queue_configurations
SET
    queue_configuration = '{
        "cron": "0 19 * * 1-5",
        "retry": 3,
        "cleanUpPeriod": 2592000000,
        "retryInterval": 180000,
        "dashboardReadonly": false
    }' :: json
WHERE
    queue_name = 'cas-supplier-integration';