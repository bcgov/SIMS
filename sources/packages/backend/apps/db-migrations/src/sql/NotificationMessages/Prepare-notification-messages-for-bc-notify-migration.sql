ALTER TABLE
    sims.notification_messages
ADD
    COLUMN notify_template_id UUID;

COMMENT ON COLUMN sims.notification_messages.notify_template_id IS 'Template ID used to send the notification.';

-- Map the existing template_id values to the new notify_template_id values based on the provided mapping.
UPDATE
    sims.notification_messages AS notification_message
SET
    notify_template_id = template_mapping.notify_template_id
FROM
    (
        VALUES
            (
                '0b1abf34-d607-4f5c-8669-71fd4a2e57fe' :: UUID,
                'e32cab62-6eeb-4618-b49c-089895afabd2' :: UUID
            ),
            (
                'a662979f-07d4-44c0-a38f-ab9fda5671fe' :: UUID,
                '4f98f056-adae-43de-9594-e2530788f2a4' :: UUID
            )
    ) AS template_mapping(template_id, notify_template_id)
WHERE
    notification_message.template_id = template_mapping.template_id;

-- Populate the new notify_template_id column with data from the existing template_id column.
UPDATE
    sims.notification_messages
SET
    notify_template_id = template_id :: UUID
WHERE
    notify_template_id IS NULL;

-- Add NOT NULL constraint to the new notify_template_id column after populating it with data from template_id.
ALTER TABLE
    sims.notification_messages
ALTER COLUMN
    notify_template_id
SET
    NOT NULL;