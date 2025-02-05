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

-- Set parent-application-id and preceding-application-id for non-draft applications when application number is present.
UPDATE
  sims.applications
SET
  parent_application_id = (
    SELECT
      id
    FROM
      sims.applications applications
    WHERE
      applications.application_number = sims.applications.application_number
    ORDER BY
      applications.submitted_date
    LIMIT
      1
  ), preceding_application_id = COALESCE(
    (
      SELECT
        id
      FROM
        sims.applications applications
      WHERE
        applications.application_number = sims.applications.application_number
        AND applications.submitted_date < sims.applications.submitted_date
      ORDER BY
        applications.submitted_date DESC
      LIMIT
        1
    ), sims.applications.id
  )
WHERE
  application_number IS NOT NULL;

UPDATE
  sims.applications
SET
  parent_application_id = sims.applications.id,
  preceding_application_id = sims.applications.id
WHERE
  application_number IS NULL;

-- Add constraints to ensure parent-application-id and preceding-application-id are not null for non-draft and non-cancelled applications.
ALTER TABLE
  sims.applications
ADD
  CONSTRAINT parent_application_id_constraint CHECK(
    parent_application_id IS NOT NULL
    OR application_status IN ('Draft')
  ),
ADD
  CONSTRAINT preceding_application_id_constraint CHECK(
    preceding_application_id IS NOT NULL
    OR application_status IN ('Draft')
  );

COMMENT ON CONSTRAINT parent_application_id_constraint ON sims.applications IS 'The parent application must be non-null for non-draft applications.';

COMMENT ON CONSTRAINT preceding_application_id_constraint ON sims.applications IS 'The preceding application must be non-null for non-draft applications.';