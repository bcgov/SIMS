-- Inserting back the previously removed types and roles.
INSERT INTO
	sims.institution_user_type_roles(user_type, user_role)
VALUES
	('admin', 'primary-contact'),
	('location-manager', NULL),
	('location-manager', 'primary-contact'),
	('user', 'primary-contact');