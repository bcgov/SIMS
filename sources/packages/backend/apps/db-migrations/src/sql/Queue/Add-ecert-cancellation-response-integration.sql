-- The scheduler is set to run at 5 p.m. UTC which is 9 a.m. PST every day.
INSERT INTO
    sims.queue_configurations(queue_name, queue_configuration, queue_settings)
VALUES
    (
        'e-cert-cancellation-response-integration',
        '{
            "cron": "0 4 * * 7",
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