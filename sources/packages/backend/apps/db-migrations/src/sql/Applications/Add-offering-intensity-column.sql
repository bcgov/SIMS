ALTER TABLE
  sims.applications
ADD
  COLUMN offering_intensity sims.offering_intensity NOT NULL DEFAULT 'Part Time';

COMMENT ON COLUMN sims.applications.offering_intensity IS 'Offering intensity related to the application.';

-- Update offering intensity for all the existing applications. For some draft applications, this will be NULL.
UPDATE
  sims.applications applications
SET
  offering_intensity = 'Full Time'
WHERE
  data ->> 'howWillYouBeAttendingTheProgram' = 'Full Time';

-- Remove the default value for offering_intensity column.
ALTER TABLE
  sims.applications
ALTER COLUMN
  offering_intensity DROP DEFAULT;