INSERT INTO
  sims.queue_configurations(queue_name, queue_configuration, queue_settings)
VALUES
  (
    'cas-send-invoices',
    '{
        "cron": "0 5,12,17 * * 1-5",
        "retry": 3,
        "cleanUpPeriod": 2592000000,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "pollingRecordLimit": 2000
     }',
    '{
        "maxStalledCount": 0,
        "lockDuration": 60000,
        "lockRenewTime": 5000
      }'
  );