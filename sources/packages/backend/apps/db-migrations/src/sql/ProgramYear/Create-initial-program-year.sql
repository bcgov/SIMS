-- Inserting initial values for 'program_year' table. This will be part of table creation migration. So, no drop migration sql, this data will destroy with table in drop migration
INSERT INTO program_years(program_year,program_year_desc, form_name)
VALUES('2021-2022','Study starting between August 01, 2021 and July 31, 2022', 'SFAA2021-22');

INSERT INTO program_years(program_year,program_year_desc, form_name)
VALUES('2022-2023','Study starting between August 01, 2022 and July 31, 2023', 'SFAA2022-23');

INSERT INTO program_years(program_year,program_year_desc, form_name)
VALUES('2023-2024','Study starting between August 01, 2023 and July 31, 2024', 'SFAA2023-24');