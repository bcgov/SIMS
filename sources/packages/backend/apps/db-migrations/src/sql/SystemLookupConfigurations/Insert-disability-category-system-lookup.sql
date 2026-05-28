WITH system_user_data AS (
    SELECT
        id
    FROM
        sims.users
    WHERE
        user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system'
    LIMIT
        1
)
INSERT INTO
    sims.system_lookup_configurations (
        lookup_category,
        lookup_value,
        lookup_key,
        lookup_priority,
        creator
    )
SELECT
    lookup_data.lookup_category,
    lookup_data.lookup_value,
    lookup_data.lookup_key,
    lookup_data.lookup_priority,
    su.id
FROM
    (
        VALUES
            (
                'Disability category',
                'Acquired brain injury',
                'ACQ_BRAIN_INJURY',
                1
            ),
            (
                'Disability category',
                'ADHD',
                'ADHD',
                1
            ),
            (
                'Disability category',
                'Autism spectrum disorder',
                'AUTISM_SPECTRUM',
                1
            ),
            (
                'Disability category',
                'Blind or low vision',
                'BLIND_LOW_VISION',
                1
            ),
            (
                'Disability category',
                'Deaf or hard of hearing',
                'DEAF_HARD_HEARING',
                1
            ),
            (
                'Disability category',
                'Learning disability',
                'LEARNING_DISABILITY',
                1
            ),
            (
                'Disability category',
                'Mental health impairment',
                'MENTAL_HEALTH_IMPAIR',
                1
            ),
            (
                'Disability category',
                'Mobility impairment',
                'MOBILITY_IMPAIRMENT',
                1
            ),
            (
                'Disability category',
                'Pervasive development disorder',
                'PERVASIVE_DEV_DIS',
                1
            ),
            (
                'Disability category',
                'Speech impairment',
                'SPEECH_IMPAIRMENT',
                1
            ),
            (
                'Disability category',
                'Other',
                'OTHER',
                2
            )
    ) AS lookup_data(
        lookup_category,
        lookup_value,
        lookup_key,
        lookup_priority
    )
    CROSS JOIN system_user_data su;