-- Creates missing provincial restrictions that were directly converted on PROD
-- and are missing in non-PROD environments DB seed.
-- Z1
INSERT INTO
    sims.restrictions (
        restriction_type,
        restriction_code,
        description,
        creator,
        restriction_category,
        action_type,
        notification_type,
        is_legacy
    )
SELECT
    'Provincial',
    'Z1',
    'Grant overaward. Not eligible for BCSL. Eligible for CSL.',
    (
        SELECT
            id
        FROM
            sims.users
        WHERE
            -- System user.
            user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system'
    ),
    'BCSL Delinquency',
    ARRAY ['Stop full time BC funding'] :: sims.restriction_action_types [],
    'Error',
    false
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            sims.restrictions
        WHERE
            restriction_code = 'Z1'
    );

-- SSRN
INSERT INTO
    sims.restrictions (
        restriction_type,
        restriction_code,
        description,
        creator,
        restriction_category,
        action_type,
        notification_type,
        is_legacy
    )
SELECT
    'Provincial',
    'SSRN',
    'Poor Scholastic Standing.',
    (
        SELECT
            id
        FROM
            sims.users
        WHERE
            -- System user.
            user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system'
    ),
    'Academic',
    ARRAY ['Stop full time disbursement', 'Stop full time apply'] :: sims.restriction_action_types [],
    'Error',
    false
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            sims.restrictions
        WHERE
            restriction_code = 'SSRN'
    );