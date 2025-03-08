CREATE TYPE sims.application_edit_status AS ENUM (
  'Original',
  'Change in progress',
  'Change pending approval',
  'Change declined',
  'Change cancelled',
  'Changed with approval',
  'Edited'
);

COMMENT ON TYPE sims.application_edit_status IS 'Status of the "application edit"(a.k.a. change request) that allows to track the changes and approvals. An application edition can be requested before or after an application is completed, which leads to different paths controlled by this status. If the application is edited before is has its main status set to "Completed" (a.k.a. before COE), the edit can be executed without any Ministry approval. If the application is edited after it has its main status set to "Completed" (a.k.a. after COE), the edit must be approved by the Ministry.';