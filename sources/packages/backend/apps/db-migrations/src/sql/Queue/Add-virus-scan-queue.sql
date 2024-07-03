INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'virus-scan',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cleanUpPeriod": 604800000
      }' :: json
  );