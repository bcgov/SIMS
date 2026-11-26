WITH
    system_user_data AS (
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
            ('Returned loan reasons', 'Standard', 'A270', 1),
            (
                'Returned loan reasons',
                'Inactive Address',
                'S90',
                2
            ),
            ('Returned loan reasons', 'Bankruptcy', 'HRDC', 3),
            (
                'Returned loan reasons',
                'Zero Balance',
                'ZERO',
                4
            ),
            (
                'Returned loan reasons',
                'DEATH WHILE REPAYMENT STATUS',
                'DIR',
                5
            ),
            (
                'Returned loan reasons',
                'DEATH WHILE IN STUDIES',
                'DIS',
                6
            ),
            (
                'Returned loan reasons',
                'PERMANENT DISABILITY',
                'PD',
                7
            ),
            ('Returned loan customer gender', 'Male', 'M', 1),
            ('Returned loan customer gender', 'Female', 'F', 2),
            (
                'Returned loan customer gender',
                'Unknown',
                'U',
                3
            )
    ) AS lookup_data (
        lookup_category,
        lookup_value,
        lookup_key,
        lookup_priority
    )
    CROSS JOIN system_user_data su;