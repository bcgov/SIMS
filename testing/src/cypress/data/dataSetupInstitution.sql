/*
Create function to get the userid using user_name from users table
*/

drop function if exists get_user_id;
create function get_user_id(_user_name varchar)
    returns int
    language plpgsql
    AS
    $$
    declare
    user_id integer;
    begin
        select id
        into user_id
        from sims.users
        where user_name = _user_name ;
        return user_id;
    end;
    $$;

/*
Get institution id using  operating name from institution table
*/

drop function if exists get_institution_id;
create function get_institution_id(_operating_name varchar)
    returns int
    language plpgsql
    as
    $$
    declare
    institution_id integer;
    begin
        select id
        into institution_id
        from sims.institutions
        where operating_name = _operating_name ;
        return institution_id;
    end;
    $$;

/*
create an institution for BC Public
*/

drop extension if exists "uuid-ossp";
create extension "uuid-ossp"; /* support for generating guid */

insert into sims.institutions
(business_guid, legal_operating_name, operating_name, primary_phone, primary_email, website, regulating_body, established_date, primary_contact, institution_address, created_at, updated_at, creator, modifier, institution_type_id)
values((select uuid_generate_v4()), 'Automation Institution',
'AuCo', '9991119911',
'autocollege@auto.test',
'www.testautomationcollege.com',
'Cypress Automation', '2020-01-01',
'{"email": "cypressautomation@auto.test", "phone": "9991119911", "lastName": "AutoUser", "firstName": "UserOne"}',
'{"mailingAddress": {"city": "Vancouver", "country": "Canada", "postalCode": "V1V1V1", "addressLine1": "7856 Automation Street", "addressLine2": "", "provinceState": "BC", "selectedCountry": "Canada"}}',
now(), now(), (SELECT get_user_id('fa06d4f6be904e10882085db1b7ac564@bceid')), (select get_user_id('fa06d4f6be904e10882085db1b7ac564@bceid')), 2);

/*
Create a location for instition
*/

insert into sims.institution_locations
("name", info, institution_id, created_at, updated_at, creator, institution_code, primary_contact)
values('Vancouver',
'{"address": {"city": "Vancouver", "country": "Canada", "postalCode": "V1V1V1", "addressLine1": "7586 Automation", "addressLine2": "", "provinceState": "BC", "selectedCountry": "Canada"}}'
, (select get_institution_id('AuCo')),now(), now() ,(select get_user_id('fa06d4f6be904e10882085db1b7ac564@bceid')) , 'AUTO',
'{"email": "location1@auto.test", "phone": "6472548796", "lastName": "location one", "firstName": "One"}');

/*
Create the user into users table
*/

insert into sims.users
(user_name, email, first_name, last_name, created_at, updated_at, is_active)
values('fa06d4f6be904e10882085db1b7ac564@bceid','automationuser1@test.com', 'SIMS', 'TEST', now(), now(), true);

/*
Insert the user into institution_users table
*/

insert into sims.institution_users
(user_id, institution_id, created_at, updated_at, creator)
values((select get_user_id('fa06d4f6be904e10882085db1b7ac564@bceid')), (select get_institution_id('AuCo')), now(), now(), (SELECT get_user_id('fa06d4f6be904e10882085db1b7ac564@bceid')));

/*
Insert the user into institution_users_auth table
*/

insert into sims.institution_user_auth (institution_user_id, institution_user_type_role_id, created_at, updated_at, creator) values((select  id from sims.institution_users where user_id in (select get_user_id('fa06d4f6be904e10882085db1b7ac564@bceid'))),1, now(), now(),(select get_user_id('fa06d4f6be904e10882085db1b7ac564@bceid')));

/*
Create a new designation agreement
*/

INSERT INTO sims.designation_agreements
(institution_id, submitted_data, designation_status, submitted_by, submitted_date, start_date, end_date, created_at, updated_at, creator)
VALUES((select get_institution_id('AuCo')),
'{"scheduleA": true, "scheduleB": true, "scheduleD": true, "agreementAccepted": true, "enrolmentOfficers": [{"name": "Enrolment Officer One", "email": "enrolment_officer@autotest.com", "phone": "6046047797", "positionTitle": "AEO"}], "legalAuthorityName": "SIMS COLLF", "eligibilityOfficers": [{"name": "Eligibility Officer One", "email": "eligibility_officer@autotest.com", "phone": "6046047781", "positionTitle": "Education Officer"}], "legalAuthorityEmailAddress": "automationuser1@test.com"}',
'Pending',
(SELECT get_user_id('fa06d4f6be904e10882085db1b7ac564@bceid')), now(),
'2022-08-09', '2024-05-10',
now(), now(), (SELECT get_user_id('fa06d4f6be904e10882085db1b7ac564@bceid')));

/*
Update the designation agreemnt to be approved
*/

update designation_agreements
set designation_status = 'Approved',
assessed_by = (select get_user_id('fa06d4f6be904e10882085db1b7ac564@bceid')),
assessed_date = now() where institution_id in (select get_institution_id('AuCo'));

/*
Insert the  designation agreement reference into designation agreement location tables
*/

insert into sims.designation_agreement_locations(designation_agreement_id,location_id,requested,approved,created_at,updated_at,creator)
 values ((select id from sims.designation_agreements where institution_id = (select get_institution_id('AuCo') )),
 (select id from sims.institution_locations where institution_id = (select get_institution_id('AuCo'))),
 true,true,
 now(),
 now(),
 (select get_user_id('fa06d4f6be904e10882085db1b7ac564@bceid')));