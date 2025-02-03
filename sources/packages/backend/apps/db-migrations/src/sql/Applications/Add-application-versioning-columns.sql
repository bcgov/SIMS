ALTER TABLE
  sims.applications
ADD
  COLUMN parent_application_id INT REFERENCES sims.applications(id);

COMMENT ON COLUMN sims.applications.parent_application_id IS 'The parent application from which the current application was created.';

ALTER TABLE
  sims.applications
ADD
  COLUMN preceding_application_id INT REFERENCES sims.applications(id);

COMMENT ON COLUMN sims.applications.preceding_application_id IS 'The immediate previous application from which the current application was created.';