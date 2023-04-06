-- drop index on the concatenated first_name and last_name column.
DROP INDEX sims.user_first_name_last_name;

-- drop extension pg_trgm.
DROP EXTENSION pg_trgm;