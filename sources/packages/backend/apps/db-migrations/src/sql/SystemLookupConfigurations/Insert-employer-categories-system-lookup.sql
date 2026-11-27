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
                'Employer category',
                'Health authority',
                'healthAuthority',
                1
            ),
            (
                'Employer category',
                'Public school',
                'publicSchool',
                2
            ),
            (
                'Employer category',
                'First nations',
                'firstNations',
                3
            ),
            (
                'Employer category',
                'Private employer',
                'privateEmployer',
                4
            ),
            (
                'Employer category',
                'Health authority affiliate',
                'healthAuthorityAffiliate',
                5
            )
    ) AS lookup_data(
        lookup_category,
        lookup_value,
        lookup_key,
        lookup_priority
    )
    CROSS JOIN system_user_data su;
