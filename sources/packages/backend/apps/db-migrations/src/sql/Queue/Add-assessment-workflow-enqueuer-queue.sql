INSERT INTO
  sims.queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'assessment-workflow-enqueuer',
    '{
        "dashboardReadonly": false,
        "cron": "*/30 * * * * *",
        "cleanUpPeriod": 3600000
      }' :: json
  );