-- The scheduler is set to run at 7 a.m. UTC which is 12 a.m. PDT every day.
INSERT INTO
  sims.queue_configurations(queue_name, queue_configuration, queue_settings)
VALUES
  (
    'file-processing-issue-notifications',
    '{
        "cron": "0 7 * * *",
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