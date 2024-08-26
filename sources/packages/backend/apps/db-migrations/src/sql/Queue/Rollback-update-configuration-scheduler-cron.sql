update
    sims.queue_configurations
set
    queue_configuration = jsonb_set(
        queue_configuration,
        '{cron}',
        '"0 14 * * *"',
        false
    )
where
    queue_name = 'ier12-integration';

update
    sims.queue_configurations
set
    queue_configuration = jsonb_set(
        queue_configuration,
        '{cron}',
        '"0 2,8,14,20 * * *"',
        false
    )
where
    queue_name = 'cra-process-integration';

update
    sims.queue_configurations
set
    queue_configuration = jsonb_set(
        queue_configuration,
        '{cron}',
        '"0 5,11,17,23 * * *"',
        false
    )
where
    queue_name = 'cra-response-integration';

update
    sims.queue_configurations
set
    queue_configuration = jsonb_set(
        queue_configuration,
        '{cron}',
        '"0 17 * * *"',
        false
    )
where
    queue_name = 'sin-validation-process-integration';

update
    sims.queue_configurations
set
    queue_configuration = jsonb_set(
        queue_configuration,
        '{cron}',
        '"0 17 * * *"',
        false
    )
where
    queue_name = 'sin-validation-request-integration';

update
    sims.queue_configurations
set
    queue_configuration = jsonb_set(
        queue_configuration,
        '{cron}',
        '"0 14 * * *"',
        false
    )
where
    queue_name = 'part-time-msfaa-process-integration';

update
    sims.queue_configurations
set
    queue_configuration = jsonb_set(
        queue_configuration,
        '{cron}',
        '"0 14 * * *"',
        false
    )
where
    queue_name = 'part-time-e-cert-integration';

update
    sims.queue_configurations
set
    queue_configuration = jsonb_set(
        queue_configuration,
        '{cron}',
        '"0 17 * * *"',
        false
    )
where
    queue_name = 'part-time-feedback-integration';

update
    sims.queue_configurations
set
    queue_configuration = jsonb_set(
        queue_configuration,
        '{cron}',
        '"0 14 * * *"',
        false
    )
where
    queue_name = 'full-time-msfaa-integration';

update
    sims.queue_configurations
set
    queue_configuration = jsonb_set(
        queue_configuration,
        '{cron}',
        '"0 14 * * *"',
        false
    )
where
    queue_name = 'full-time-e-cert-integration';

update
    sims.queue_configurations
set
    queue_configuration = jsonb_set(
        queue_configuration,
        '{cron}',
        '"0 17 * * *"',
        false
    )
where
    queue_name = 'full-time-feedback-integration';

update
    sims.queue_configurations
set
    queue_configuration = jsonb_set(
        queue_configuration,
        '{cron}',
        '"0 11 * * *"',
        false
    )
where
    queue_name = 'federal-restrictions-integration';

update
    sims.queue_configurations
set
    queue_configuration = jsonb_set(
        queue_configuration,
        '{cron}',
        '"0 17 * * *"',
        false
    )
where
    queue_name = 'disbursement-receipts-file-integration';

update
    sims.queue_configurations
set
    queue_configuration = jsonb_set(
        queue_configuration,
        '{cron}',
        '"0 14 * * *"',
        false
    )
where
    queue_name = 'ece-process-integration';

update
    sims.queue_configurations
set
    queue_configuration = jsonb_set(
        queue_configuration,
        '{cron}',
        '"0 14 * * *"',
        false
    )
where
    queue_name = 'ece-process-response-integration';

update
    sims.queue_configurations
set
    queue_configuration = jsonb_set(
        queue_configuration,
        '{cron}',
        '"0 17 * * *"',
        false
    )
where
    queue_name = 'part-time-msfaa-process-response-integration';

update
    sims.queue_configurations
set
    queue_configuration = jsonb_set(
        queue_configuration,
        '{cron}',
        '"0 17 * * *"',
        false
    )
where
    queue_name = 'full-time-msfaa-process-response-integration';

update
    sims.queue_configurations
set
    queue_configuration = jsonb_set(
        queue_configuration,
        '{cron}',
        '"0 17 * * *"',
        false
    )
where
    queue_name = 'student-loan-balances-part-time-integration';

update
    sims.queue_configurations
set
    queue_configuration = jsonb_set(
        queue_configuration,
        '{cron}',
        '"0 12 * * *"',
        false
    )
where
    queue_name = 'sfas-integration';