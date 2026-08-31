ALTER TABLE
    sims.notifications
ADD
    COLUMN template_id UUID NULL,
ADD
    COLUMN recipients varchar(254) ARRAY NULL,
ADD
    COLUMN message jsonb NULL;

COMMENT ON COLUMN sims.notifications.template_id IS 'Template ID used to send the notification.';

COMMENT ON COLUMN sims.notifications.recipients IS 'Notification recipient email addresses.';

COMMENT ON COLUMN sims.notifications.message IS 'JSON data containing the notification message.';

-- Populate all new columns with data from the existing message_payload column.
UPDATE
    sims.notifications
SET
    template_id = (message_payload ->> 'template_id') :: UUID,
    recipients = ARRAY [message_payload ->> 'email_address'],
    message = jsonb_build_object(
        'params',
        (message_payload -> 'personalisation') - 'application_file'
    ) || CASE
        WHEN (message_payload -> 'personalisation') ? 'application_file' THEN jsonb_build_object(
            'attachments',
            jsonb_build_array(
                jsonb_build_object(
                    'content',
                    message_payload -> 'personalisation' -> 'application_file' ->> 'file',
                    'filename',
                    message_payload -> 'personalisation' -> 'application_file' ->> 'filename',
                    'contentType',
                    CASE
                        WHEN lower(
                            right(
                                message_payload -> 'personalisation' -> 'application_file' ->> 'filename',
                                4
                            )
                        ) = '.txt' THEN 'text/plain'
                        WHEN lower(
                            right(
                                message_payload -> 'personalisation' -> 'application_file' ->> 'filename',
                                4
                            )
                        ) = '.csv' THEN 'text/csv'
                    END
                )
            )
        )
        ELSE '{}' :: jsonb
    END
WHERE
    message_payload IS NOT NULL;

-- Add NOT NULL constraints to the new columns after populating them with data from message_payload.
ALTER TABLE
    sims.notifications
ALTER COLUMN
    template_id
SET
    NOT NULL,
ALTER COLUMN
    recipients
SET
    NOT NULL,
ALTER COLUMN
    message
SET
    NOT NULL;