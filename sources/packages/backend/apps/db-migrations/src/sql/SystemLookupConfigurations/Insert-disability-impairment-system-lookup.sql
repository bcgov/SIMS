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
                'Ascend/Descend stairs',
                'ASC_DESC_STAIRS',
                1
            ),
            (
                'Disability impairment',
                'Attending classes',
                'ATTENDING_CLASSES',
                1
            ),
            (
                'Disability impairment',
                'Completing tasks on time',
                'COMPLETE_TASKS_TIME',
                1
            ),
            (
                'Disability impairment',
                'Focus and concentration',
                'FOCUS_CONCENTRATION',
                1
            ),
            (
                'Disability impairment',
                'Following instructions',
                'FOLLOWING_INSTRUCT',
                1
            ),
            (
                'Disability impairment',
                'Handwriting',
                'HANDWRITING',
                1
            ),
            (
                'Disability impairment',
                'Hearing',
                'HEARING',
                1
            ),
            (
                'Disability impairment',
                'Keyboarding/Typing',
                'KEYBOARDING_TYPING',
                1
            ),
            (
                'Disability impairment',
                'Lifting/Carrying/Holding/Reaching',
                'LIFT_CARRY_REACH',
                1
            ),
            (
                'Disability impairment',
                'Reading',
                'READING',
                1
            ),
            (
                'Disability impairment',
                'Remembering information',
                'REMEMBERING_INFO',
                1
            ),
            (
                'Disability impairment',
                'Sitting',
                'SITTING',
                1
            ),
            (
                'Disability impairment',
                'Speaking/Communicating',
                'SPEAK_COMMUNICATE',
                1
            ),
            (
                'Disability impairment',
                'Standing',
                'STANDING',
                1
            ),
            (
                'Disability impairment',
                'Staying on task',
                'STAYING_ON_TASK',
                1
            ),
            (
                'Disability impairment',
                'Taking notes in class',
                'TAKING_NOTES_CLASS',
                1
            ),
            (
                'Disability impairment',
                'Using Stairs',
                'USING_STAIRS',
                1
            ),
            (
                'Disability impairment',
                'Vision',
                'VISION',
                1
            ),
            (
                'Disability impairment',
                'Walking',
                'WALKING',
                1
            ),
            (
                'Disability impairment',
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