-- Restore the returned loans scheduler to 8 a.m. Vancouver time.
UPDATE
    sims.queue_configurations
SET
    queue_configuration = jsonb_set(
        queue_configuration,
        '{repeatOptions,pattern}',
        '"0 8 * * *"',
        false
    )
WHERE
    queue_name = 'esdc.returned-loans-response-integration';

DELETE FROM
    sims.queue_configurations
WHERE
    queue_name IN (
        'workflow.start-application-assessment',
        'workflow.cancel-application-assessment',
        'institution.ier12-integration',
        'cra.cra-process-integration',
        'cra.cra-response-integration',
        'esdc.sin-validation-process-integration',
        'esdc.sin-validation-response-integration',
        'esdc.part-time-msfaa-process-integration',
        'esdc.part-time-e-cert-integration',
        'esdc.part-time-feedback-integration',
        'esdc.full-time-msfaa-integration',
        'esdc.full-time-e-cert-integration',
        'esdc.full-time-feedback-integration',
        'esdc.federal-restrictions-integration',
        'esdc.disbursement-receipts-file-integration',
        'institution.ece-process-integration',
        'institution.ece-process-response-integration',
        'esdc.part-time-msfaa-process-response-integration',
        'esdc.full-time-msfaa-process-response-integration',
        'sfas.sfas-integration',
        'notifications.process-notifications',
        'application.archive-applications',
        'workflow.assessment-workflow-enqueuer',
        'workflow.assessment-workflow-queue-retry',
        'esdc.student-loan-balances-part-time-integration',
        'cas.cas-supplier-integration',
        'cas.cas-invoices-batches-creation',
        'cas.cas-send-invoices',
        'esdc.application-changes-report-integration',
        'notifications.student-application-notifications',
        'sfas.sims-to-sfas-integration',
        'esdc.e-cert-cancellation-response-integration',
        't4a.t4a-upload-enqueuer',
        't4a.t4a-upload'
    );