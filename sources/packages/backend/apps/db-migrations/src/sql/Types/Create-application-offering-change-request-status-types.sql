CREATE TYPE sims.application_offering_change_request_status_types AS ENUM (
  'In progress with student',
  'In progress with SABC',
  'Approved',
  'Declined by student',
  'Declined by SABC'
);