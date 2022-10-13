CREATE TABLE IF NOT EXISTS sims.notifications (
    id SERIAL PRIMARY KEY,
    -- Reference Columns
    user_id INT REFERENCES users(id),
    template_id UUID NOT NULL,
    message_id INT REFERENCES messages(id) ON DELETE CASCADE,
    message_payload jsonb NOT NULL,
    date_sent timestamp with time zone,
    date_read timestamp with time zone,
    -- Audit columns
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE
    SET
        NULL,
        modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE
    SET
        NULL
);

-- ## Comments
COMMENT ON TABLE notifications IS 'Table to store notifications.';

COMMENT ON COLUMN notifications.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN notifications.user_id IS 'Foreign key reference to the users table.';

COMMENT ON COLUMN notifications.message_id IS 'Foreign key reference to the messages table.';

COMMENT ON COLUMN notifications.message_payload IS 'JSON data containing message payload.';

COMMENT ON COLUMN notifications.date_sent IS 'Record date notification was sent.';

COMMENT ON COLUMN notifications.date_read IS 'Record date was read.';

COMMENT ON COLUMN applications.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN applications.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN applications.creator IS 'Creator of the record. Null specified the record is created by system';

COMMENT ON COLUMN applications.modifier IS 'Modifier of the record. Null specified the record is modified by system';