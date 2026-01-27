-- Create new index
CREATE INDEX users_lower_email ON sims.users(lower(email));

COMMENT ON INDEX sims.users_lower_email IS 'Index created on lower(email) to improve the performance of case-insensitive email searches.';