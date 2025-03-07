ALTER TABLE
  sims.applications
ADD
  -- Adding new column with the default 'Edited' to later be removed.
  COLUMN application_edit_status sims.application_edit_status NOT NULL DEFAULT 'Edited',
ADD
  -- Default will be dropped at the end of this script.
  COLUMN application_edit_status_updated_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
ADD
  -- A NOT NULL constraint will be added at the end of this script.
  COLUMN application_edit_status_updated_by INT REFERENCES sims.users(id),
ADD
  COLUMN application_edit_status_note_id INT REFERENCES sims.notes(id);

COMMENT ON COLUMN sims.applications.application_edit_status IS 'Status of the application related to possible editions that resulted in different versions of the same application.';

COMMENT ON COLUMN sims.applications.application_edit_status_updated_on IS 'Last date and time when the edit status changed.';

COMMENT ON COLUMN sims.applications.application_edit_status_updated_by IS 'User that changed the edit status last time.';

COMMENT ON COLUMN sims.applications.application_edit_status_note_id IS 'Note added by the Ministry while approving or declining the edited application.';

-- When application have an application number, the first application version of every existing application should be 'Original', or
-- when application does not have an application number (draft or cancelled), the application version should also be 'Original'.
UPDATE
  sims.applications
SET
  application_edit_status = 'Original'
WHERE
  application_number IS NULL
  OR id IN (
    SELECT
      id
    FROM
      (
        SELECT
          applications.id,
          applications.application_number,
          row_number() over (
            PARTITION by application_number
            ORDER BY
              id
          ) AS row_number
        FROM
          sims.applications applications
        WHERE
          applications.application_number IS NOT NULL
      ) AS numbered_applications
    WHERE
      -- Only the first application version of every existing application should be selected.
      numbered_applications.row_number = 1
  );

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