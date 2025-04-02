ALTER TABLE
  sims.applications
ADD
  COLUMN offering_intensity sims.offering_intensity DEFAULT 'Part Time';

COMMENT ON COLUMN sims.applications.offering_intensity IS 'Offering intensity related to the application.';

-- Update offering intensity for all the existing applications. For some draft applications, this will be NULL.
UPDATE
  sims.applications applications
SET
  offering_intensity = (
    applications.data ->> 'howWillYouBeAttendingTheProgram'
  ) :: sims.offering_intensity
WHERE
  offering_intensity IS NULL
  AND data ->> 'howWillYouBeAttendingTheProgram' IN ('Part Time', 'Full Time');

-- Remove the default value for offering_intensity column.
ALTER TABLE
  sims.applications
ALTER COLUMN
  sims.offering_intensity DROP DEFAULT;