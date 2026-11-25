UPDATE
    sims.notification_messages
SET
    description = 'Ministry notification for institution restriction blocking application.',
    template_id = '7bfb8b35-fdf9-4b11-862a-4fc55397bc8c',
    updated_at = now()
WHERE
    id = 42;