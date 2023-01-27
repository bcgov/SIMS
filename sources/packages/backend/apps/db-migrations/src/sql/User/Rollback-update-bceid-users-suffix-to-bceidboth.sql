UPDATE
    sims.users
SET
    user_name = REPLACE(user_name, '@bceidboth', '@bceid')
WHERE
    user_name ilike '%@bceidboth'