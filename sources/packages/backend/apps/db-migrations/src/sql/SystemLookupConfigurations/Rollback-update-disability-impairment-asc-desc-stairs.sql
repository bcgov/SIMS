-- 1. Restore the lookup_key 'USING_STAIRS'
INSERT INTO
    sims.system_lookup_configurations(
        lookup_category,
        lookup_key,
        lookup_value,
        lookup_priority,
        creator
    )
VALUES
    (
        'Disability impairment',
        'USING_STAIRS',
        'Using Stairs',
        1,
        (
            SELECT
                id
            FROM
                sims.users
            WHERE
                -- System user.
                user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system'
        )
    );

-- 2. Restore migrated data
UPDATE
    sims.student_disability_profile_disabilities
SET
    impairments = impairments_before_update
WHERE
    impairments_before_update IS NOT NULL;

-- 3. Drop backup column from student_disability_profile_disabilities
ALTER TABLE
    sims.student_disability_profile_disabilities DROP COLUMN impairments_before_update;

-- 4. Restore the lookup_value to 'Ascend/Descend stairs'
UPDATE
    sims.system_lookup_configurations
SET
    lookup_value = 'Ascend/Descend stairs'
WHERE
    lookup_category = 'Disability impairment'
    AND lookup_key = 'ASC_DESC_STAIRS';