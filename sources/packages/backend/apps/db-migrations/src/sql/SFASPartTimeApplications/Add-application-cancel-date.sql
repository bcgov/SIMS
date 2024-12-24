ALTER TABLE
  sims.sfas_part_time_applications
ADD
  COLUMN application_cancel_date DATE;

COMMENT ON COLUMN sims.sfas_part_time_applications.application_cancel_date IS 'Date that this application was cancelled (sail_application_events.event_date).';