-- Inserting values to 'queue_configurations' table. This will be part of table creation migration. So, no drop migration sql, this data will destroy with table in drop migration.
INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'start-application-assessment',
    '{ "attempts": 3, "backoff": 180000, "dashboardReadonly": false }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'ier12-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 14 * * *"
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'cra-process-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 2,8,14,20 * * *"
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'cra-response-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 5,11,17,23 * * *"
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'sin-validation-process-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 17 * * *"
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'sin-validation-request-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 17 * * *"
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'pt-msfaa-process-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 14 * * *"
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'pt-e-cert-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 14 * * *"
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'pt-feedback-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 17 * * *"
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'ft-msfaa-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 14 * * *"
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'ft-e-cert-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 14 * * *"
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'ft-feedback-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 17 * * *"
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'federal-restrictions-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 11 * * *"
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'ft-disbursement-receipts-file-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 17 * * *"
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'ece-process-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 14 * * *"
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'ece-process-response-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 14 * * *"
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'fin-process-provincial-daily-disbursements-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 18 * * *"
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'pt-msfaa-process-response-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 17 * * *"
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'ft-msfaa-process-response-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 17 * * *"
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'sfass-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 12 * * *"
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'atbc-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'atbc-response-integration',
    '{
        "attempts": 3,
        "backoff": 180000,
        "dashboardReadonly": false,
        "cron": "0 17 * * *"
      }' :: json
  );

INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'process-notifications',
    '{
        "dashboardReadonly": false,
        "cron": "* * * * *"
      }' :: json
  );