CREATE TYPE sims.application_edit_status AS ENUM (
  'Original',
  'Edit in progress',
  'Edit pending approval',
  'Edit declined',
  'Edited with approval',
  'Edited'
);