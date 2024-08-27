update
    sims.queue_configurations
set
    queue_name = 'sin-validation-response-integration'
where
    queue_name = 'sin-validation-request-integration';