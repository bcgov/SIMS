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
                'Works with children occupations',
                'Audiologist',
                'audiologist',
                1
            ),
            (
                'Works with children occupations',
                'Occupational therapist',
                'occupationalTherapist',
                1
            ),
            (
                'Works with children occupations',
                'Physiotherapist',
                'physiotherapist',
                1
            ),
            (
                'Works with children occupations',
                'School psychologist',
                'schoolPsychologist',
                1
            ),
            (
                'Works with children occupations',
                'Speech language pathologist',
                'speechLanguagePathologist',
                1
            ),
            (
                'Works with children occupations',
                'Teacher of the deaf/hard of hearing or the visually impaired',
                'teacherOfTheDeafHardOfHearingOrTheVisuallyImpaired',
                1
            ),
            (
                'Works with children occupations',
                'Technology educator',
                'technologyEducator',
                1
            )
    ) AS lookup_data(
        lookup_category,
        lookup_value,
        lookup_key,
        lookup_priority
    )
    CROSS JOIN system_user_data su;
