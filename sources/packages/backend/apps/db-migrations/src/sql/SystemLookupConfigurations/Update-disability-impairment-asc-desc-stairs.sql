-- 1. Rename the lookup_value to 'Ascend/Descend/Use stairs'
UPDATE
    sims.system_lookup_configurations
SET
    lookup_value = 'Ascend/Descend/Use stairs'
WHERE
    lookup_category = 'Disability impairment'
    AND lookup_key = 'ASC_DESC_STAIRS';

-- 2. Create a column to hold the previous value
ALTER TABLE
    sims.student_disability_profile_disabilities
ADD
    impairments_before_update VARCHAR(100) [];

COMMENT ON COLUMN sims.student_disability_profile_disabilities.impairments_before_update IS 'Column created to store the impairments information before update for rollback.';

-- 3. Backup the existing value and update student_disability_profile_disabilities to replace 'USING_STAIRS' with 'ASC_DESC_STAIRS'
UPDATE
    sims.student_disability_profile_disabilities
SET
    impairments_before_update = impairments,
    impairments = array_replace(
        impairments,
        'USING_STAIRS',
        'ASC_DESC_STAIRS'
    )
WHERE
    'USING_STAIRS' = ANY(impairments);

-- 4. Drop the lookup_key 'USING_STAIRS'
DELETE FROM
    sims.system_lookup_configurations
WHERE
    lookup_category = 'Disability impairment'
    AND lookup_key = 'USING_STAIRS';