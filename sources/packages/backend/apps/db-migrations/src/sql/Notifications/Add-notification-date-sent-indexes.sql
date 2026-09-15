CREATE INDEX notifications_date_sent_null ON sims.notifications (date_sent)
WHERE
    date_sent IS NULL;

CREATE INDEX notifications_date_sent ON sims.notifications (date_sent);

COMMENT ON INDEX sims.notifications_date_sent_null IS 'Index for quickly finding notifications to be sent.';

COMMENT ON INDEX sims.notifications_date_sent IS 'Index for quickly finding notifications by date_sent.';