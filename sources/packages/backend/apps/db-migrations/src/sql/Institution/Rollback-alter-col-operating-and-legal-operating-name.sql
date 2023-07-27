-- Rollback the column legal_operating_name type.
ALTER TABLE
    sims.institutions
ALTER COLUMN
    legal_operating_name TYPE VARCHAR(64);

-- Rollback the column operating_name type.
ALTER TABLE
    sims.institutions
ALTER COLUMN
    operating_name TYPE VARCHAR(64);