-- Adding new column with the default 'Original' to later be removed.
ALTER TABLE
  sims.applications
ADD
  COLUMN application_edit_status sims.application_edit_status NOT NULL DEFAULT 'Original',
ADD
  COLUMN application_edit_status_updated_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
ADD
  COLUMN application_edit_status_updated_by INT REFERENCES sims.users(id),
ADD
  COLUMN application_edit_status_note_id INT REFERENCES sims.notes(id);

COMMENT ON COLUMN sims.applications.application_edit_status IS 'Status of the application related to possible editions that resulted in different versions of the same application.';

COMMENT ON COLUMN sims.applications.application_edit_status_updated_on IS 'Last date and time when the edit status changed.';

COMMENT ON COLUMN sims.applications.application_edit_status_updated_by IS 'User that changed the edit status last time.';

COMMENT ON COLUMN sims.applications.application_edit_status_note_id IS 'Note added by the Ministry while approving or declining the edit application.';

-- Update any application different than the first one to 'Edited'.
UPDATE
  sims.applications
SET
  application_edit_status = 'Edited'
WHERE
  parent_application_id != preceding_application_id;

-- Update the edit user as the system user for all existing applications.
UPDATE
  sims.applications
SET
  application_edit_status_updated_by = (
    SELECT
      id
    FROM
      sims.users
    WHERE
      last_name = 'system-user'
    LIMIT
      1
  );

-- Removing the dummy constraints created just to allow us
-- to add a "NOT NULL" column in an existing table and add a 
-- NOT NULL constraint to the updated_by column.
ALTER TABLE
  sims.applications
ALTER COLUMN
  application_edit_status DROP DEFAULT,
ALTER COLUMN
  application_edit_status_updated_on DROP DEFAULT,
ALTER COLUMN
  application_edit_status_updated_by
SET
  NOT NULL;