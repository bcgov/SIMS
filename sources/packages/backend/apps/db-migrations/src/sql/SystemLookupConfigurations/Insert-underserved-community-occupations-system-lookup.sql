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
                'Underserved community occupations',
                'Audiologist',
                'audiologist',
                1
            ),
            (
                'Underserved community occupations',
                'Diagnostic medical sonographer',
                'diagnosticMedicalSonographer',
                1
            ),
            (
                'Underserved community occupations',
                'Medical laboratory technologist',
                'medicalLaboratoryTechnologist',
                1
            ),
            (
                'Underserved community occupations',
                'Midwifery',
                'midwifery',
                1
            ),
            (
                'Underserved community occupations',
                'Nursing (including licensed practical nursing, nurse practitioners, registered psychiatric nurses and registered nurses)',
                'nursingIncludingLicensedPracticalNursingNurse',
                1
            ),
            (
                'Underserved community occupations',
                'Occupational therapist',
                'occupationalTherapist',
                1
            ),
            (
                'Underserved community occupations',
                'Physician, including residents',
                'physicianIncludingResidents',
                1
            ),
            (
                'Underserved community occupations',
                'Physiotherapist',
                'physiotherapist',
                1
            ),
            (
                'Underserved community occupations',
                'Polysomnographer',
                'polysomnographer',
                1
            ),
            (
                'Underserved community occupations',
                'Radiation therapist',
                'radiationTherapist',
                1
            ),
            (
                'Underserved community occupations',
                'Respiratory therapist',
                'respiratoryTherapist',
                1
            ),
            (
                'Underserved community occupations',
                'Speech language pathologist',
                'speechLanguagePathologist',
                1
            )
    ) AS lookup_data(
        lookup_category,
        lookup_value,
        lookup_key,
        lookup_priority
    )
    CROSS JOIN system_user_data su;
