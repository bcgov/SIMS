ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN sims.applications.is_archived IS 'Represents flag to indicate an application has been archived.';