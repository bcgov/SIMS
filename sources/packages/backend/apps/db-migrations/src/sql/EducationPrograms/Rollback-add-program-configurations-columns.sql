ALTER TABLE
  sims.education_programs DROP COLUMN program_data,
  DROP COLUMN program_configuration_id;

ALTER TABLE
  sims.education_programs_history DROP COLUMN program_data,
  DROP COLUMN program_configuration_id;