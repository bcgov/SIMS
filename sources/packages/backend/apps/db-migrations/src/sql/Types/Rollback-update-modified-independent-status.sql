CREATE TYPE sims.modified_independent_status_to_rollback AS ENUM ('Not requested', 'Approved', 'Declined');

ALTER TABLE
  sims.students
ALTER COLUMN
  modified_independent_status DROP DEFAULT,
ALTER COLUMN
  modified_independent_status TYPE sims.modified_independent_status_to_rollback USING (
    CASE
      modified_independent_status :: text
      WHEN 'Requested' THEN 'Not requested'
      ELSE modified_independent_status :: text
    END
  ) :: sims.modified_independent_status_to_rollback,
ALTER COLUMN
  modified_independent_status
SET
  DEFAULT 'Not requested';

ALTER TABLE
  sims.students_history
ALTER COLUMN
  modified_independent_status TYPE sims.modified_independent_status_to_rollback USING (
    CASE
      modified_independent_status :: text
      WHEN 'Requested' THEN 'Not requested'
      ELSE modified_independent_status :: text
    END
  ) :: sims.modified_independent_status_to_rollback;

DROP TYPE sims.modified_independent_status;

ALTER TYPE sims.modified_independent_status_to_rollback RENAME TO modified_independent_status;