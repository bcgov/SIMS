-- The scheduler is set to run at 4 p.m. UTC which is 8 a.m. PST every monday.
INSERT INTO
    sims.queue_configurations(queue_name, queue_configuration, queue_settings)
VALUES
    (
        'application-changes-report-integration',
        '{
            "cron": "0 16 * * 1",
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