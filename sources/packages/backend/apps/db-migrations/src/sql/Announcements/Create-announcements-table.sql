CREATE TABLE IF NOT EXISTS sims.announcements (
    id SERIAL PRIMARY KEY,
    message_title VARCHAR(100) NOT NULL,
    message VARCHAR(200) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW (),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW (),
    target text [],
    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creator INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
    SET
        NULL,
        modifier INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
    SET
        NULL
);

-- ## Comments
COMMENT ON TABLE sims.announcements IS 'The table for storing system announcements.';

COMMENT ON COLUMN sims.announcements.message_title IS 'Title for the announcement.';

COMMENT ON COLUMN sims.announcements.message IS 'Message text for the announcement.';

COMMENT ON COLUMN sims.announcements.start_date IS 'When the message starts.';

COMMENT ON COLUMN sims.announcements.end_date IS 'When the message finishes.';

COMMENT ON COLUMN sims.announcements.target IS 'Represents the screens the message should appear on, in a CSV list.';

COMMENT ON COLUMN sims.announcements.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.announcements.updated_at IS 'Record update timestamp.';