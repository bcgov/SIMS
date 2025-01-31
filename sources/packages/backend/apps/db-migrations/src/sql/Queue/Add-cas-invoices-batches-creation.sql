INSERT INTO
  sims.queue_configurations(queue_name, queue_configuration, queue_settings)
VALUES
  (
    'cas-invoices-batches-creation',
    '{
        "cron": "0 4 * * 1-5",
        "retry": 3,
        "cleanUpPeriod": 2592000000,
        "retryInterval": 180000,
        "dashboardReadonly": false
     }',
    '{
        "maxStalledCount": 0,
        "lockDuration": 60000,
        "lockRenewTime": 5000
      }'
  );