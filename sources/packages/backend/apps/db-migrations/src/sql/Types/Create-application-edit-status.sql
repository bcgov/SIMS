CREATE TYPE sims.application_edit_status AS ENUM (
  'Original',
  'Change in progress',
  'Change pending approval',
  'Change declined',
  'Changed with approval',
  'Edited'
);