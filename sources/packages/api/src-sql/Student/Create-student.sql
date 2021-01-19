CREATE TABLE IF NOT EXISTS student(
  id SERIAL PRIMARY KEY,
  address VARCHAR(300) NOT NULL,
  sin VARCHAR(10) NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now()
);