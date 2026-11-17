-- Add the columns to track the education programs renewals across program years.
ALTER TABLE sims.education_programs
ADD COLUMN preceding_program_id INT REFERENCES sims.education_programs (id),
ADD COLUMN parent_program_id INT REFERENCES sims.education_programs (id);

COMMENT ON COLUMN sims.education_programs.preceding_program_id IS 'The immediate previous program, from the previous program year, from which the current program was renewed.';

COMMENT ON COLUMN sims.education_programs.parent_program_id IS 'The first program in the renewal chain from which the current program was renewed.';

CREATE UNIQUE INDEX education_programs_unique_preceding_program_id ON sims.education_programs (preceding_program_id)
WHERE
  preceding_program_id IS NOT NULL;

COMMENT ON INDEX sims.education_programs_unique_preceding_program_id IS 'Enforces that a program can be renewed only once, into the next program year configuration. The renewed program can then be renewed into the following program year configuration, allowing the renewal chain to continue for every new program year configuration.';

-- Add new columns to the history table.
ALTER TABLE sims.education_programs_history
ADD COLUMN preceding_program_id INT,
ADD COLUMN parent_program_id INT;

COMMENT ON COLUMN sims.education_programs_history.preceding_program_id IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.parent_program_id IS 'Historical data from the original table. See original table comments for details.';

-- Backfill parent_program_id, making each existing program the parent of its own renewal chain.
UPDATE sims.education_programs
SET
  parent_program_id = id;