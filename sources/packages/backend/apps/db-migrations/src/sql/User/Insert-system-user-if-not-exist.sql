-- Create system user if not exists.
INSERT INTO
    sims.users (user_name, last_name, email, created_at)
VALUES
    (
        '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system',
        'system-user',
        'dev_sabc@gov.bc.ca',
        NOW()
    ) ON CONFLICT (user_name) DO NOTHING;