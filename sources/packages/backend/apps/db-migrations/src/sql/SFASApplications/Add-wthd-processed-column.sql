ALTER TABLE
    sims.sfas_applications
ADD
    COLUMN wthd_processed BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN sims.sfas_applications.wthd_processed IS 'Indicates whether a withdrawal restriction (WTHD) was already evaluated.';