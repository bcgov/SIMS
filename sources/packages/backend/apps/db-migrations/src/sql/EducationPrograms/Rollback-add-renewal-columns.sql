ALTER TABLE sims.education_programs
DROP COLUMN preceding_program_id,
DROP COLUMN parent_program_id;

ALTER TABLE sims.education_programs_history
DROP COLUMN preceding_program_id,
DROP COLUMN parent_program_id;
