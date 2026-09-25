-- The scheduler is set to run at 4 p.m. UTC which is 8 a.m. PST every day.
INSERT INTO
    sims.queue_configurations(queue_name, queue_configuration, queue_settings)
VALUES
    (
        'returned-loans-response-integration',
        '{
            "cron": "0 16 * * *",
            "retry": 3,
            "cleanUpPeriod": 2592000000,
            "retryInterval": 180000,
            "dashboardReadonly": false
        }' :: jsonb,
        '{ 
            "maxStalledCount": 0,
            "lockDuration": 60000,
            "lockRenewTime": 5000
        }' :: jsonb
    );