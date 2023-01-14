INSERT INTO
  sims.queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'archive-applications',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 7 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  );