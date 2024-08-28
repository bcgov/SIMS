UPDATE
    sims.queue_configurations
SET
    queue_configuration = '{
        "retry": 12,
        "retryInterval": 900000,
        "dashboardReadonly": false,
        "cleanUpPeriod": 604800000
    }' :: json
WHERE
    queue_name = 'virus-scan';