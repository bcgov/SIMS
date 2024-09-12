CREATE TABLE sims.announcements (
    id SERIAL PRIMARY KEY,
    message_title VARCHAR(100) NOT NULL,
    message VARCHAR(500) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    target text [] NOT NULL
);

-- ## Comments
COMMENT ON TABLE sims.announcements IS 'The table for storing system announcements.';

COMMENT ON COLUMN sims.announcements.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.announcements.message_title IS 'Title for the announcement.';

COMMENT ON COLUMN sims.announcements.message IS 'Message text for the announcement.';

COMMENT ON COLUMN sims.announcements.start_date IS 'Timestamp for when the system announcement starts.';

COMMENT ON COLUMN sims.announcements.end_date IS 'Timestamp for when the system announcement finishes.';

COMMENT ON COLUMN sims.announcements.target IS 'Represents the screens the message should appear on.';