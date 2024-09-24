CREATE TABLE IF NOT EXISTS beta_users_authorizations(
  id SERIAL PRIMARY KEY,
  given_names VARCHAR(100) NULL,
  last_name VARCHAR(100) NOT NULL,
  enabled_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT beta_users_authorizations_name_unique UNIQUE (given_names, last_name)
);

-- ## Comments
COMMENT ON TABLE beta_users_authorizations IS 'Beta users authorizations table. Only users with a BCSC credential that matches given name and last name in the period starting from `enabled_from` column will be allowed during the beta user period.';

COMMENT ON COLUMN beta_users_authorizations.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN beta_users_authorizations.given_names IS 'Beta user given names.';

COMMENT ON COLUMN beta_users_authorizations.last_name IS 'Beta user last name.';

COMMENT ON COLUMN beta_users_authorizations.enabled_from IS 'Starting date and time to enable beta user to access the system.';