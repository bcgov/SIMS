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

-- Set parent-application-id for non-draft applications.
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
  )
WHERE
  application_number IS NOT NULL;

-- Set preceding-application-id for non-draft applications.
UPDATE
  sims.applications
SET
  preceding_application_id = COALESCE(
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

-- Add constraints to ensure parent-application-id and preceding-application-id are not null for non-draft and non-cancelled applications.
ALTER TABLE
  sims.applications
ADD
  CONSTRAINT parent_application_id_contraint CHECK(
    parent_application_id IS NOT NULL
    OR application_status IN ('Draft', 'Cancelled')
  ),
ADD
  CONSTRAINT preceding_application_id_contraint CHECK(
    preceding_application_id IS NOT NULL
    OR application_status IN ('Draft', 'Cancelled')
  );