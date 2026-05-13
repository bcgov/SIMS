-- The scheduler is set to run at 2 p.m. UTC which is 7 a.m. PDT M-F.
INSERT INTO
  sims.queue_configurations(queue_name, queue_configuration, queue_settings)
VALUES
  (
    'file-processing-issue-notification',
    '{
        "cron": "0 14 * * 1-5",
        "retry": 3,
        "cleanUpPeriod": 2592000000,
        "retryInterval": 180000,
        "dashboardReadonly": false
     }' :: json,
    '{
        "maxStalledCount": 0,
        "lockDuration": 60000,
        "lockRenewTime": 5000
      }' :: json
  );