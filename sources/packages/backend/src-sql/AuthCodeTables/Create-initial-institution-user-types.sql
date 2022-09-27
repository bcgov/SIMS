-- Inserting initial values for 'institution_user_type_roles' table. This will be part of table creation migration. So, no drop migration sql, this data will destroy with table in drop migration
INSERT INTO institution_user_type_roles(user_type,user_role)
VALUES
('admin','legal-signing-authority');

INSERT INTO institution_user_type_roles(user_type,user_role)
VALUES('admin','primary-contact');

INSERT INTO institution_user_type_roles(user_type,user_role)
VALUES('admin',NULL);

INSERT INTO institution_user_type_roles(user_type,user_role)
VALUES('location-manager',NULL);

INSERT INTO institution_user_type_roles(user_type,user_role)
VALUES('location-manager', 'primary-contact');

INSERT INTO institution_user_type_roles(user_type,user_role)
VALUES('user', NULL);

INSERT INTO institution_user_type_roles(user_type,user_role)
VALUES('user','primary-contact');

