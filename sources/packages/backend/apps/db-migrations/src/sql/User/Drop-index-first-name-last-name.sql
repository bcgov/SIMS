-- # drop index on the concatenated first_name and last_name column.
DROP INDEX sims.first_name_last_name_gin_idx;

-- # drop extension pg_trgm.
DROP EXTENSION pg_trgm;