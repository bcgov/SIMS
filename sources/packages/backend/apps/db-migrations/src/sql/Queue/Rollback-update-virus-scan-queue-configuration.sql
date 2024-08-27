UPDATE
    sims.queue_configurations
SET
    queue_configuration = '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cleanUpPeriod": 604800000
    }' :: json
WHERE
    queue_name = 'virus-scan';