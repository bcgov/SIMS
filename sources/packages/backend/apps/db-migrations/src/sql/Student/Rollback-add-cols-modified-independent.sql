ALTER TABLE
  sims.students_history DROP COLUMN modified_independent_status,
  DROP COLUMN modified_independent_appeal_request_id;

ALTER TABLE
  sims.students DROP COLUMN modified_independent_status,
  DROP COLUMN modified_independent_appeal_request_id;