-- Remove unused types and roles. The related records on table 
-- sims.institution_user_auth will be automatically removed.
DELETE FROM
    sims.institution_user_type_roles
WHERE
    user_role = 'primary-contact'
    OR user_type = 'location-manager'