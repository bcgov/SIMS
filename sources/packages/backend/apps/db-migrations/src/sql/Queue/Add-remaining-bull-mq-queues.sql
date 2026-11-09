-- Create new BullMQ queue configurations.
INSERT INTO
    sims.queue_configurations(queue_name, queue_configuration)
VALUES
    (
        'workflow.start-application-assessment',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 86400
                }
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'workflow.cancel-application-assessment',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 604800
                }
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'institution.ier12-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "15/30 * * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'cra.cra-process-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 22 * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'cra.cra-response-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 9 * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'esdc.sin-validation-process-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 7 * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'esdc.sin-validation-response-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 7 * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'esdc.part-time-msfaa-process-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 1 * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'esdc.part-time-e-cert-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 1 * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'esdc.part-time-feedback-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 5 * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'esdc.full-time-msfaa-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 2 * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'esdc.full-time-e-cert-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 23 * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'esdc.full-time-feedback-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 13 * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'esdc.federal-restrictions-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 6 * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'esdc.disbursement-receipts-file-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 3600000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "30 11 * * 1-5",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'institution.ece-process-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 23 * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'institution.ece-process-response-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "45 2 * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'esdc.part-time-msfaa-process-response-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 5 * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'esdc.full-time-msfaa-process-response-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "15 10 * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'sfas.sfas-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "15/30 * * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'notifications.process-notifications',
        $json$
        {
            "defaultJobOptions": {
                "removeOnComplete": {
                    "age": 1800
                }
            },
            "repeatOptions": {
                "pattern": "*/30 * * * * *",
                "tz": "America/Vancouver"
            },
            "jobData": {
                "pollingRecordsLimit": 100,
                "externalRateLimit": 490,
                "externalRateLimitSeconds": 60
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'application.archive-applications',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 0 * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'workflow.assessment-workflow-enqueuer',
        $json$
        {
            "defaultJobOptions": {
                "removeOnComplete": {
                    "age": 3600
                }
            },
            "repeatOptions": {
                "pattern": "*/30 * * * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'workflow.assessment-workflow-queue-retry',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 * * * *",
                "tz": "America/Vancouver"
            },
            "jobData": {
                "amountHoursAssessmentRetry": 6
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'esdc.student-loan-balances-part-time-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 5184000
                }
            },
            "repeatOptions": {
                "pattern": "30 23 * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'cas.cas-supplier-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 13 * * 1-5",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'cas.cas-invoices-batches-creation',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 21 * * 0-4",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'cas.cas-send-invoices',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 8,13,19 * * 1-5",
                "tz": "America/Vancouver"
            },
            "jobData": {
                "pollingRecordsLimit": 2000
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'esdc.application-changes-report-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 9 * * 1",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'notifications.student-application-notifications',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 1 * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'sfas.sims-to-sfas-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 1,5,9,13,17,21 * * *",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        'esdc.e-cert-cancellation-response-integration',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 21 * * 6",
                "tz": "America/Vancouver"
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        't4a.t4a-upload-enqueuer',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 2592000
                }
            },
            "repeatOptions": {
                "pattern": "0 6 * 2-5 *",
                "tz": "America/Vancouver"
            },
            "jobData": {
                "maxFileUploadsPerBatch": 100
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    ),
    (
        't4a.t4a-upload',
        $json$
        {
            "defaultJobOptions": {
                "attempts": 3,
                "backoff": 180000,
                "removeOnComplete": {
                    "age": 604800
                }
            },
            "dashboardReadonly": false
        }
        $json$::jsonb
    );

-- The returned loans scheduler runs at 9 a.m. Vancouver time (4 p.m. UTC, UTC-7).
UPDATE
    sims.queue_configurations
SET
    queue_configuration = jsonb_set(
        queue_configuration,
        '{repeatOptions,pattern}',
        '"0 9 * * *"',
        false
    )
WHERE
    queue_name = 'esdc.returned-loans-response-integration';
