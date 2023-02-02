-- Update the BCeID suffix to be in accordance with the new BCeID suffix 
-- after the Keycloak migration from Silver to Gold cluster.
UPDATE
    sims.users
SET
    user_name = REPLACE(user_name, '@bceid', '@bceidboth')
WHERE
    user_name ilike '%@bceid'