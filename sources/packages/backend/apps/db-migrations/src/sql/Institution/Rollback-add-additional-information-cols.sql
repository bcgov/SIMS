ALTER TABLE
    sims.institutions DROP COLUMN country,
    DROP COLUMN province,
    DROP COLUMN classification,
    DROP COLUMN organization_status,
    DROP COLUMN medical_school_status;

-- Remove columns from history table.
ALTER TABLE
    sims.institutions_history DROP COLUMN country,
    DROP COLUMN province,
    DROP COLUMN classification,
    DROP COLUMN organization_status,
    DROP COLUMN medical_school_status;