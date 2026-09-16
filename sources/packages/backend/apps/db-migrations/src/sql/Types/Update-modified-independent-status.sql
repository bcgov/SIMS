CREATE TYPE sims.modified_independent_status_to_be_updated AS ENUM (
  'Requested',
  'Not requested',
  'Approved',
  'Declined'
);

ALTER TABLE
  sims.students
ALTER COLUMN
  modified_independent_status DROP DEFAULT,
ALTER COLUMN
  modified_independent_status TYPE sims.modified_independent_status_to_be_updated USING (modified_independent_status :: text) :: sims.modified_independent_status_to_be_updated,
ALTER COLUMN
  modified_independent_status
SET
  DEFAULT 'Not requested';

ALTER TABLE
  sims.students_history
ALTER COLUMN
  modified_independent_status TYPE sims.modified_independent_status_to_be_updated USING (modified_independent_status :: text) :: sims.modified_independent_status_to_be_updated;

DROP TYPE sims.modified_independent_status;

ALTER TYPE sims.modified_independent_status_to_be_updated RENAME TO modified_independent_status;