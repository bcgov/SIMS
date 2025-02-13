-- Adding new column with the default 'Original' to later be removed.
ALTER TABLE
  sims.applications
ADD
  COLUMN application_edit_status sims.application_edit_status NOT NULL DEFAULT 'Original';

-- Update any application different than the first one to 'Edited'.
UPDATE
  sims.applications
SET
  application_edit_status = 'Edited'
WHERE
  parent_application_id != parent_application_id;

-- Removing the dummy constraint created just to allow us
-- to add a "NOT NULL" column in an existing table.
ALTER TABLE
  sims.applications
ALTER COLUMN
  application_edit_status DROP DEFAULT;