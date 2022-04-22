--Removing the value Scholastic Standing from sims.offering_types.
--As postgres does not support removal of an Enum Value, We create a temporary enum and rename it.
CREATE TYPE sims.offering_types_to_rollback AS ENUM ('Public', 'Private');

ALTER TABLE
    sims.education_programs_offerings
ALTER COLUMN
    offering_type TYPE sims.offering_types_to_rollback USING CASE
        WHEN offering_type = 'Scholastic Standing' then 'Private'
        else 'Public' :: sims.offering_types_to_rollback
    END;

DROP TYPE sims.offering_types;

ALTER TYPE sims.offering_types_to_rollback RENAME TO offering_types;