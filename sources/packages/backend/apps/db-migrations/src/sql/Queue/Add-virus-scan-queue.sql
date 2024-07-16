INSERT INTO
  queue_configurations(queue_name, queue_configuration, queue_settings)
VALUES
  (
    'virus-scan',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cleanUpPeriod": 604800000
      }' :: json,
    '{ "maxStalledCount": 0, "lockDuration": 60000, "lockRenewTime": 5000 }'
  );