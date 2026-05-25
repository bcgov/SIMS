-- Ministry notification for institution adds pending program
UPDATE
    sims.notification_messages
SET
    template_id = '98b38e6b-a015-48e8-8058-1e21402bb1b6'
WHERE
    id = 23;

-- Ministry notification for institution adds pending offering
UPDATE
    sims.notification_messages
SET
    template_id = 'b4e6252b-e196-4c14-9a29-1b2a71e9131a'
WHERE
    id = 24;