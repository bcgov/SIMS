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

-- First ever saved application should be considered the original one.
UPDATE
  sims.applications
SET
  application_edit_status = 'Original',
  application_edit_status_updated_on = NOW()
WHERE
  id = parent_application_id;

-- Consider the student as the one updating the application_edit_status_updated_by because
-- at this moment only students can edit the applications and no Ministry approval is required.
UPDATE
  sims.applications applications
SET
  application_edit_status_updated_by = users.id
FROM
  sims.students students
  INNER JOIN sims.users users ON students.user_id = users.id
WHERE
  applications.student_id = students.id;

-- Removing the dummy DEFAULT constraints created just to allow us
-- to add a "NOT NULL" column in an existing table and added a 
-- NOT NULL constraint to the application_edit_status_updated_by column.
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