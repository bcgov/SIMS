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
                'Program length',
                '12 weeks to 52 weeks',
                '12WeeksTo52Weeks',
                1
            ),
            (
                'Program length',
                '53 weeks to 59 weeks',
                '53WeeksTo59Weeks',
                2
            ),
            (
                'Program length',
                '60 weeks to less than 2 years',
                '60WeeksToLessThan2Years',
                3
            ),
            (
                'Program length',
                '2 Years to less than 3Years',
                '2YearsToLessThan3Years',
                4
            ),
            (
                'Program length',
                '3 Years to less than 4 Years',
                '3YearsToLessThan4Years',
                5
            ),
            (
                'Program length',
                '4 Years to less than 5Years',
                '4YearsToLessThan5Years',
                6
            ),
            (
                'Program length',
                '5 Years or More',
                '5YearsOrMore',
                7
            ),
            (
                'Institution regulatory body',
                'PTIRU',
                'ptiru',
                1
            ),
            (
                'Institution regulatory body',
                'DQAB',
                'dqab',
                2
            ),
            (
                'Institution regulatory body',
                'Private Act of B.C. Legislature',
                'skilledTradesBC',
                3
            ),
            (
                'Institution regulatory body',
                'Skilled Trades BC',
                'icbc',
                4
            ),
            (
                'Institution regulatory body',
                'ICBC',
                'senateOrEducationCouncil',
                5
            ),
            (
                'Institution regulatory body',
                'Senate, Academic Council, Education Council, and/or Program Council and Board of Governors',
                '4YearsToLessThan5Years',
                6
            ),
            (
                'Institution regulatory body',
                'Other',
                'other',
                7
            ),
            (
                'Program entrance requirement',
                'Students to have graduated from grade 12 or equivalent.',
                'minHighSchool',
                1
            ),
            (
                'Program entrance requirement',
                'Students are 19 years old or older before the start of classes.',
                'hasMinimumAge',
                2
            ),
            (
                'Program entrance requirement',
                'For post-secondary level academic credit-based programs: This program has entrance requirements established by the institution that enable completion of the program of study.',
                'requirementsByInstitution',
                3
            ),
            (
                'Program entrance requirement',
                'This program is approved by the SkilledTradesBC and students must meet the entrance requirements set by the B.C. ITA.',
                'requirementsByBCITA',
                4
            ),
            (
                'Program entrance requirement',
                'None of the above',
                'noneOfTheAboveEntranceRequirements',
                5
            ),
            (
                'Program aviation credential',
                'Commercial Pilot Training',
                'commercialPilotTraining',
                1
            ),
            (
                'Program aviation credential',
                'Instructor''s Rating',
                'instructorsRating',
                2
            ),
            (
                'Program aviation credential',
                'Endorsements',
                'endorsements',
                3
            ),
            (
                'Program aviation credential',
                'Private Pilot Training',
                'privatePilotTraining',
                4
            )
    ) AS lookup_data(
        lookup_category,
        lookup_value,
        lookup_key,
        lookup_priority
    )
    CROSS JOIN system_user_data su;