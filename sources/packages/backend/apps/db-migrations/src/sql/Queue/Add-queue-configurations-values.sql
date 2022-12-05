-- Inserting values to 'queue_configurations' table. This will be part of table creation migration. So, no drop migration sql, this data will destroy with table in drop migration.
INSERT INTO
  queue_configurations(name, configuration)
VALUES
  (
    'start-application-assessment',
    '{ "attempts": 3, "backoff": 180000, "dashboardReadonly": false }' :: json
  );

INSERT INTO
  queue_configurations(name, configuration)
VALUES
  (
    'ier12-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 17 * * *"
      }' :: json
  );