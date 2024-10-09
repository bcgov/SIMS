-- The scheduler is set to run at 4 p.m. UTC which is 8 a.m. PST every monday.
INSERT INTO
    sims.queue_configurations(queue_name, queue_configuration, queue_settings)
VALUES
    (
        'sims-to-sfas-integration',
        '{
            "cron": "0 0,4,8,12,16,20 * * *",
            "retry": 3,
            "cleanUpPeriod": 2592000000,
            "retryInterval": 180000,
            "dashboardReadonly": false
        }' :: json,
        '{ 
            "maxStalledCount": 0,
            "lockDuration": 60000,
            "lockRenewTime": 5000
        }' :: json
    );