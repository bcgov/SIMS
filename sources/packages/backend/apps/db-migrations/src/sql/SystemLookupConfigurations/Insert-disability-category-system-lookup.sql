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
                'Mental Health Disorder',
                'MENTHLTH',
                1
            ),
            (
                'Disability category',
                'Blind or Visually Impaired',
                'BLINDVI',
                2
            ),
            (
                'Disability category',
                'Attention Deficit Hyperactivity Disorder (ADHD)',
                'ADHD',
                3
            ),
            (
                'Disability category',
                'Deaf or Hard of Hearing',
                'DEAFHARD',
                4
            ),
            (
                'Disability category',
                'Autism Spectrum Disorder (ASD)',
                'ASD',
                5
            ),
            (
                'Disability category',
                'Neurological Disability',
                'NEURODISX',
                6
            ),
            (
                'Disability category',
                'Physical Disability / Mobility Impairment',
                'PHYSDISAB',
                7
            ),
            (
                'Disability category',
                'Other',
                'OTHER',
                8
            )
    ) AS lookup_data(
        lookup_category,
        lookup_value,
        lookup_key,
        lookup_priority
    )
    CROSS JOIN system_user_data su;