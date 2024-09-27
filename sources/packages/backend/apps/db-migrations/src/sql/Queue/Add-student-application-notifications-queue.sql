INSERT INTO
  sims.queue_configurations(queue_name, queue_configuration, queue_settings)
VALUES
  (
    'student-application-notifications',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 8 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json,
    '{ 
          "maxStalledCount": 0,
          "lockDuration": 60000,
          "lockRenewTime": 5000
      }' :: json
  );