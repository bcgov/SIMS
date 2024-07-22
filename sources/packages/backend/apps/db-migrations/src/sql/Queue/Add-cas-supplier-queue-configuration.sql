INSERT INTO
  sims.queue_configurations(queue_name, queue_configuration, queue_settings)
VALUES
  (
    'cas-supplier-integration',
    '{
      "cron": "0 7 * * *",
      "retry": 3,
      "cleanUpPeriod": 2592000000,
      "retryInterval": 180000,
      "dashboardReadonly": false
    }' :: json,
    '{ "maxStalledCount": 0,
       "lockDuration": 60000,
       "lockRenewTime": 5000
    }' :: json
  );