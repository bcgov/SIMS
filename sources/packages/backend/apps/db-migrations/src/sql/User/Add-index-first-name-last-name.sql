-- # pg_trgm extension to enable gin index.
CREATE EXTENSION pg_trgm;

-- # gin index on the concatenated first_name and last_name column.
CREATE INDEX first_name_last_name_gin_idx ON sims.users USING gin((first_name || ' ' || last_name) gin_trgm_ops);