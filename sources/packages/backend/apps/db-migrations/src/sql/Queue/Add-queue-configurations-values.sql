-- Inserting values to 'queue_configurations' table. This will be part of table creation migration. So, no drop migration sql, this data will destroy with table in drop migration.
INSERT INTO
  queue_configurations(queue_name, queue_configuration)
VALUES
  (
    'start-application-assessment',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cleanUpPeriod": 86400000
      }' :: json
  ),
  (
    'ier12-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 14 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  ),
  (
    'cra-process-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 2,8,14,20 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  ),
  (
    'cra-response-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 5,11,17,23 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  ),
  (
    'sin-validation-process-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 17 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  ),
  (
    'sin-validation-request-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 17 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  ),
  (
    'part-time-msfaa-process-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 14 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  ),
  (
    'part-time-e-cert-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 14 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  ),
  (
    'part-time-feedback-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 17 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  ),
  (
    'full-time-msfaa-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 14 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  ),
  (
    'full-time-e-cert-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 14 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  ),
  (
    'full-time-feedback-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 17 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  ),
  (
    'federal-restrictions-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 11 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  ),
  (
    'full-time-disbursement-receipts-file-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 17 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  ),
  (
    'ece-process-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 14 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  ),
  (
    'ece-process-response-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 14 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  ),
  (
    'fin-process-provincial-daily-disbursements-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 18 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  ),
  (
    'part-time-msfaa-process-response-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 17 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  ),
  (
    'full-time-msfaa-process-response-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 17 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  ),
  (
    'sfass-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 12 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  ),
  (
    'atbc-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false
      }' :: json
  ),
  (
    'atbc-response-integration',
    '{
        "retry": 3,
        "retryInterval": 180000,
        "dashboardReadonly": false,
        "cron": "0 17 * * *",
        "cleanUpPeriod": 2592000000
      }' :: json
  ),
  (
    'process-notifications',
    '{
        "dashboardReadonly": false,
        "cron": "* * * * *",
        "cleanUpPeriod": 1800000,
        "pollingRecordLimit": 100
      }' :: json
  );