INSERT INTO
  sims.queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'student-loan-balances-part-time-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 17 * * *",
        "cleanUpPeriod": 5184000000
    }' :: json
  );