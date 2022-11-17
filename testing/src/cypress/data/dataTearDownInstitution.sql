
delete from sims.designation_agreement_locations where location_id  = (select id from sims.institution_locations where institution_id = (select get_institution_id('AuCo')));
delete from sims.designation_agreements where institution_id = (select get_institution_id('AuCo'));
delete from sims.institution_user_auth where institution_user_id in (select id from sims.institution_users where user_id in (select id from sims.users where user_name in ('fa06d4f6be904e10882085db1b7ac564@bceid','b7aa48239e1449279aee013dc6e4df23@bceid')));
delete from sims.institution_users  where user_id  in (select id from sims.users where user_name in ('fa06d4f6be904e10882085db1b7ac564@bceid','b7aa48239e1449279aee013dc6e4df23@bceid'));
delete from sims.users  where  user_name  in ( 'fa06d4f6be904e10882085db1b7ac564@bceid','b7aa48239e1449279aee013dc6e4df23@bceid');
delete from institution_locations where institution_id = (select get_institution_id('AuCo'));
delete from institutions where  id = (select get_institution_id('AuCo'));