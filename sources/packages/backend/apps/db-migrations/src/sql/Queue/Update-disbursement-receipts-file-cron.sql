update
    sims.queue_configurations
set
    queue_configuration = jsonb_set(
        queue_configuration,
        '{cron}',
        '"30 18 * * 1 -5"',
        false
    )
where
    queue_name = 'disbursement-receipts-file-integration';