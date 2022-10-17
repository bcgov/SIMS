CREATE TABLE IF NOT EXISTS sims.notification_messages (
    id INT PRIMARY KEY,
    description VARCHAR(1000) NOT NULL,
    template_id UUID NOT NULL,
    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    creator INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
    SET
        NULL,
        modifier INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
    SET
        NULL
);

INSERT INTO
    sims.notification_messages(id, description, template_id)
VALUES
    (
        1,
        'Student File Upload',
        '3b37994f-464f-4eb0-ad30-84739fa82377'
    ),
    (
        2,
        'Ministry File Upload',
        '0b1abf34-d607-4f5c-8669-71fd4a2e57fe'
    );

-- Comments for table and column
COMMENT ON TABLE sims.notification_messages IS 'Table to store messages.';

COMMENT ON COLUMN sims.notification_messages.id IS 'Primary key column.';

COMMENT ON COLUMN sims.notification_messages.description IS 'Description of a message.';

COMMENT ON COLUMN sims.notification_messages.template_id IS 'Template id of a message.';

COMMENT ON COLUMN sims.notification_messages.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.notification_messages.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.notification_messages.creator IS 'Creator of the record. Null specified the record is created by system.';

COMMENT ON COLUMN sims.notification_messages.modifier IS 'Modifier of the record. Null specified the record is modified by system.';