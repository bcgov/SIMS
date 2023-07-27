-- Alter the column legal_operating_name type.
ALTER TABLE
    sims.institutions
ALTER COLUMN
    legal_operating_name TYPE VARCHAR(250);

-- Alter the column operating_name type.
ALTER TABLE
    sims.institutions
ALTER COLUMN
    operating_name TYPE VARCHAR(250);