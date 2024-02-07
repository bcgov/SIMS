ALTER TABLE
    sims.education_programs
ALTER COLUMN
    none_of_entrance_requirements DROP NOT NULL;

ALTER TABLE
    sims.education_programs
ALTER COLUMN
    none_of_entrance_requirements DROP DEFAULT;