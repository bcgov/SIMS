INSERT INTO
    queue_configurations(queue_name, queue_configuration)
VALUES
    (
        'fin-process-provincial-daily-disbursements-integration',
        '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 18 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
    );