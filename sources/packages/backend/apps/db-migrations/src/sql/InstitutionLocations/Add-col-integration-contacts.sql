ALTER TABLE
    sims.institution_locations
ADD
    COLUMN integration_contacts VARCHAR(300) [];

COMMENT ON COLUMN sims.institution_locations.integration_contacts IS 'Contacts who receive notification email on integration file processing.';