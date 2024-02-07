UPDATE
    sims.education_programs ep
SET
    none_of_entrance_requirements = false
WHERE
    ep.none_of_entrance_requirements IS NULL;

ALTER TABLE
    sims.education_programs
ALTER COLUMN
    none_of_entrance_requirements
SET
    NOT NULL;

ALTER TABLE
    sims.education_programs
ALTER COLUMN
    none_of_entrance_requirements
SET
    DEFAULT false;