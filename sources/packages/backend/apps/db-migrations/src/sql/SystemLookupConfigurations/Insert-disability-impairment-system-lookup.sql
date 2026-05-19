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
                'Disability impairment',
                'Standing',
                'STAND',
                1
            ),
            (
                'Disability impairment',
                'Vision',
                'VISION',
                2
            ),
            (
                'Disability impairment',
                'Sitting',
                'SIT',
                3
            ),
            (
                'Disability impairment',
                'Hearing',
                'HEAR',
                4
            ),
            (
                'Disability impairment',
                'Walking',
                'WALK',
                5
            ),
            (
                'Disability impairment',
                'Following instructions',
                'FOLLOWINST',
                6
            ),
            (
                'Disability impairment',
                'Using Stairs',
                'STAIRS',
                7
            ),
            (
                'Disability impairment',
                'Organizing Thoughts',
                'ORGTHGHT',
                8
            ),
            (
                'Disability impairment',
                'Attending Classes',
                'ATTCLASS',
                9
            ),
            (
                'Disability impairment',
                'Speaking/Communicating',
                'SPEAKING',
                10
            ),
            (
                'Disability impairment',
                'Lifting/Carrying/Holding/Reaching',
                'LIFTING',
                11
            ),
            (
                'Disability impairment',
                'Focus and Concentration',
                'FOCUS',
                12
            ),
            (
                'Disability impairment',
                'Handwriting',
                'HANDWRITE',
                13
            ),
            (
                'Disability impairment',
                'Remembering Information',
                'REMEMBER',
                14
            ),
            (
                'Disability impairment',
                'Keyboarding/Typing',
                'KEYBOARD',
                15
            ),
            (
                'Disability impairment',
                'Staying on Task',
                'STAYONTASK',
                16
            ),
            (
                'Disability impairment',
                'Taking Notes in Class',
                'TAKENOTES',
                17
            ),
            (
                'Disability impairment',
                'Completing Tasks on Time',
                'COMPTASK',
                18
            ),
            (
                'Disability impairment',
                'Reading',
                'READ',
                19
            ),
            (
                'Disability impairment',
                'Other',
                'OTHER',
                20
            )
    ) AS lookup_data(
        lookup_category,
        lookup_value,
        lookup_key,
        lookup_priority
    )
    CROSS JOIN system_user_data su;