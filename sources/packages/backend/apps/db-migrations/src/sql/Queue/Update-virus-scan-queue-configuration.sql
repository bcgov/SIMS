update
    sims.queue_configurations
set
    queue_configuration = '{
        "retry": 12,
        "retryInterval": 900000,
        "dashboardReadonly": false,
        "cleanUpPeriod": 604800000
    }' :: json
where
    queue_name = 'virus-scan';