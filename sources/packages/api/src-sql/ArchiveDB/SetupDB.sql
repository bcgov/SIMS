-- Individual table
CREATE TABLE IF NOT EXISTS individual ( 
  individual_idx serial primary key,
  sin numeric(22,9),
  permanent_disability_flg varchar(1),
  date_of_birth timestamp without time zone
);

-- Insert Test Item
INSERT INTO individual(sin,permanent_disability_flg,date_of_birth) VALUES (123456799.000000000,'Y','2000-03-11 00:00:00');