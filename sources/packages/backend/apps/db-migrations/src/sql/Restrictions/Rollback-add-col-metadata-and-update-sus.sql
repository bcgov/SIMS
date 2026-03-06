-- Drop column metadata will implicitly rollback the update to the metadata for SUS restriction.
ALTER TABLE
    sims.restrictions DROP COLUMN metadata;