INSERT INTO
  sims.queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'student-loan-balances',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 17 * * *",
        "cleanUpPeriod": 2592000000
    }' :: json
  );