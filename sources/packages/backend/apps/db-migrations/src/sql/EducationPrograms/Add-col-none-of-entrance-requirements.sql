-- Add none_of_entrance_requirements column to education_programs table
ALTER TABLE
    sims.education_programs
ADD
    COLUMN none_of_entrance_requirements BOOLEAN;

COMMENT ON COLUMN sims.education_programs.none_of_entrance_requirements IS 'True when none of the entrance requirements is selected.';