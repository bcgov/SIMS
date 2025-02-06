DROP INDEX sims.parent_application_id_idx,
sims.preceding_application_id_idx;

ALTER TABLE
  sims.applications DROP CONSTRAINT parent_application_id_constraint,
  DROP CONSTRAINT preceding_application_id_constraint;

ALTER TABLE
  sims.applications DROP COLUMN parent_application_id,
  DROP COLUMN preceding_application_id;