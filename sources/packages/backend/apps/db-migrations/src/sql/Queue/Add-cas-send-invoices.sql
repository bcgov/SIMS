# Running the scheduler for cas send invoice every day Monday to Friday at 1 am, 1 pm and 8 pm UTC / at 5 am, 5 pm and 12 am PST.
INSERT INTO
  sims.queue_configurations(queue_name, queue_configuration, queue_settings)
VALUES
  (
    'cas-send-invoices',
    '{
        "cron": "0 1,13,20 * * 1-5",
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