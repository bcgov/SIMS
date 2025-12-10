INSERT INTO
    sims.queue_configurations(queue_name, queue_configuration, queue_settings)
VALUES
    (
        -- The scheduler is set to run at 5 PM PST, every day, from February to May.
        't4a-upload-enqueuer',
        '{
            "cron": "0 13 * 2-5 *",
            "retry": 3,
            "cleanUpPeriod": 2592000000,
            "retryInterval": 180000,
            "dashboardReadonly": false,
            "maxFileUploadsPerBatch": 100
        }' :: jsonb,
        '{ 
            "maxStalledCount": 0,
            "lockDuration": 60000,
            "lockRenewTime": 5000
        }' :: jsonb
    ),
    (
        't4a-upload',
        '{
            "retry": 3,
            "removeOnComplete": true,
            "retryInterval": 180000,
            "dashboardReadonly": false
        }' :: jsonb,
        '{ 
            "maxStalledCount": 0,
            "lockDuration": 60000,
            "lockRenewTime": 5000
        }' :: jsonb
    )