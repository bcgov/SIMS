-- Create new index
CREATE INDEX users_lower_email ON sims.users(lower(email));