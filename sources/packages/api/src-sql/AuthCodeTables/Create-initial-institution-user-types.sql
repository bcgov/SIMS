-- Inserting initial values for 'institution_user_type_roles' table. This will be part of table creation migration. So, no drop migration sql, this data will destroy with table in drop migration
INSERT INTO institution_user_type_roles(user_type,user_role,user_type_description,user_role_description)
VALUES
('admin','legal-signing-authority','Administrator: This role can only be assigned on the Institution Account. This role is able to view/edit program information requests, view/create programs, view/create designation agreements, and view students as well as confirm enrolment for all locations. Can also view/edit institution account details and institution location details. Manage users for the institution account and institution location', 'Legal Signing authority: Is able to view/edit program information requests, view/create programs, view/create/sign designation agreements, and view students as well as confirm enrolment for all locations. Can also view/edit institution profile, locations, and manage users. This is the only role allowed to sign designation agreements. To be assigned this role you must be an "Administrator"');

INSERT INTO institution_user_type_roles(user_type,user_role,user_type_description,user_role_description)
VALUES('admin','primary-contact', 'Administrator: This role can only be assigned on the Institution Account. This role is able to view/edit program information requests, view/create programs, view/create designation agreements, and view students as well as confirm enrolment for all locations. Can also view/edit institution account details and institution location details. Manage users for the institution account and institution location.', 'Primary Contact: Only 1 primary contact can exist per "Institution Location" & "Intuition Account". This roll will be used displayed on other pages.');

INSERT INTO institution_user_type_roles(user_type,user_role,user_type_description,user_role_description)
VALUES('admin',NULL,'Administrator: This role can only be assigned on the Institution Account. This role is able to view/edit program information requests, view/create programs, view/create designation agreements, and view students as well as confirm enrolment for all locations. Can also view/edit institution account details and institution location details. Manage users for the institution account and institution location', NULL);

INSERT INTO institution_user_type_roles(user_type,user_role,user_type_description,user_role_description)
VALUES('location-manager',NULL,'Location Manager: This role can only be assigned on an Institution Location. This role is able to view/edit program information requests, view/create programs, and view students as well as confirm enrolment for the authorized location level. Can also view institution location details, and manage Institution Location users.',NULL);

INSERT INTO institution_user_type_roles(user_type,user_role,user_type_description,user_role_description)
VALUES('location-manager','primary-contact','Location Manager: This role can only be assigned on an Institution Location. This role is able to view/edit program information requests, view/create programs, and view students as well as confirm enrolment for the authorized location level. Can also view institution location details, and manage Institution Location users.','Primary Contact: Only 1 primary contact can exist per "Institution Location" & "Intuition Account". This roll will be used displayed on other pages.');

INSERT INTO institution_user_type_roles(user_type,user_role,user_type_description,user_role_description)
VALUES('user', NULL, 'User: This role can only be assigned on an Institution Location. This role is able to view/edit program information requests, view/create programs, and view students as well as confirm enrolment for the authorized location level. Can view institution location details.', NULL);

INSERT INTO institution_user_type_roles(user_type,user_role,user_type_description,user_role_description)
VALUES('user','primary-contact', 'User: This role can only be assigned on an Institution Location. This role is able to view/edit program information requests, view/create programs, and view students as well as confirm enrolment for the authorized location level. Can view institution location details.','Primary Contact: Only 1 primary contact can exist per "Institution Location" & "Intuition Account". This roll will be used displayed on other pages.');

