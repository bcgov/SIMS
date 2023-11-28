INSERT INTO
    sims.queue_configurations(queue_name, queue_configuration)
VALUES
    (
        'assessment-workflow-queue-retry',
        '{
            "cron": "0 0 * * * ?",
            "retry": 3,
            "cleanUpPeriod": 2592000000,
            "retryInterval": 180000,
            "dashboardReadonly": false,
            "amountHoursAssessmentRetry": 6
        }' :: json
    );