-- Ministry notification for institution adds pending program
-- Previous template: '98b38e6b-a015-48e8-8058-1e21402bb1b6'
UPDATE
    sims.notification_messages
SET
    template_id = '999e31e1-ea2d-4583-a17c-106906340266'
WHERE
    id = 23;

-- Ministry notification for institution adds pending offering
-- Previous template: 'b4e6252b-e196-4c14-9a29-1b2a71e9131a'
UPDATE
    sims.notification_messages
SET
    template_id = '9f0a0f79-05a6-4b81-9e71-6a85906601ef'
WHERE
    id = 24;