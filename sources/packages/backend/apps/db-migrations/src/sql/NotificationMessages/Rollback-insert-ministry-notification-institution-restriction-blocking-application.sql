UPDATE
    sims.notification_messages
SET
    description = 'Ministry notification for suspension restriction blocking application.',
    template_id = '0f756338-670d-4fee-bba4-fd69f8210d17',
    updated_at = now()
WHERE
    id = 42;