CREATE TABLE sims.users_history (
  history_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  history_operation varchar(20) NOT NULL,
  id INT,
  user_name VARCHAR(300),
  email VARCHAR(300),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  is_active bool,
  creator INT,
  modifier INT,
  identity_provider_type sims."identity_provider_types"
);

CREATE INDEX users_history_timestamp ON sims.users_history(history_timestamp);