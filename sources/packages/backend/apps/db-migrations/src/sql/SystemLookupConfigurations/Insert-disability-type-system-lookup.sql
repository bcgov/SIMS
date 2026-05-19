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
                'Disability type',
                'Mental Health Disorder',
                'MENTHLTH',
                1
            ),
            (
                'Disability type',
                'Blind or Visually Impaired',
                'BLINDVI',
                2
            ),
            (
                'Disability type',
                'Attention Deficit Hyperactivity Disorder (ADHD)',
                'ADHD',
                3
            ),
            (
                'Disability type',
                'Deaf or Hard of Hearing',
                'DEAFHARD',
                4
            ),
            (
                'Disability type',
                'Autism Spectrum Disorder (ASD)',
                'ASD',
                5
            ),
            (
                'Disability type',
                'Neurological Disability',
                'NEURODISX',
                6
            ),
            (
                'Disability type',
                'Physical Disability / Mobility Impairment',
                'PHYSDISAB',
                7
            ),
            (
                'Disability type',
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