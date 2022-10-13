CREATE TABLE IF NOT EXISTS sims.notification_messages (
    id INT PRIMARY KEY,
    description VARCHAR(1000) NOT NULL,
    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE
    SET
        NULL,
        modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE
    SET
        NULL
);

INSERT INTO
    sims.notification_messages(id, description)
VALUES
    (1, 'Student File Upload'),
    (2, 'Ministry File Upload');

-- Comments for table and column
COMMENT ON TABLE sims.notification_messages IS 'Table to store messages.';

COMMENT ON COLUMN sims.notification_messages.id IS 'Primary key column.';

COMMENT ON COLUMN sims.notification_messages.description IS 'Description of a message.';

COMMENT ON COLUMN sims.notification_messages.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.notification_messages.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.notification_messages.creator IS 'Creator of the record. Null specified the record is created by system.';

COMMENT ON COLUMN sims.notification_messages.modifier IS 'Modifier of the record. Null specified the record is modified by system.';