update
    sims.queue_configurations
set
    queue_name = 'full-time-disbursement-receipts-file-integration'
where
    queue_name = 'disbursement-receipts-file-integration';