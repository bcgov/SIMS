-- Remove column part_time_basis_program
ALTER TABLE
  sims.education_programs DROP COLUMN IF EXISTS part_time_basis_program;