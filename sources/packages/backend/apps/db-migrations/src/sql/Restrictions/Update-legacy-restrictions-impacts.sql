-- Remove the SSRN legacy map since it will become a direct map to the SIMS restriction.
DELETE FROM
    sims.sfas_restriction_maps sfas_restriction_map
WHERE
    sfas_restriction_map.code = 'LGCY_SSRN';

-- Rename the existing legacy SSRN converting it to a non-legacy restriction.
UPDATE
    sims.restrictions restrictions
SET
    restriction_code = 'SSRN',
    description = 'Poor Scholastic Standing.',
    restriction_category = 'Academic',
    notification_type = 'Error',
    is_legacy = false,
    action_type = ARRAY ['Stop full time disbursement', 'Stop full time apply'] :: sims.restriction_action_types [],
    updated_at = NOW(),
    modifier = (
        SELECT
            id
        FROM
            sims.users
        WHERE
            -- System user.
            user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system'
    )
WHERE
    restriction_code = 'LGCY_SSRN';

-- Remap LGCY_SSD to SSR.
-- Delete the legacy LGCY_SSD map, if exists to ensure the insert can be executed.
DELETE FROM
    sims.sfas_restriction_maps
WHERE
    code = 'LGCY_SSD';

-- Insert the new SSR map.
INSERT INTO
    sims.sfas_restriction_maps (legacy_code, code, is_legacy_only)
VALUES
    ('SSR', 'LGCY_SSD', TRUE);

-- Delete legacy Z1 map.
DELETE FROM
    sims.sfas_restriction_maps
WHERE
    legacy_code = 'Z1';

-- Delete Z1 federal restriction.
DELETE FROM
    sims.restrictions
WHERE
    restriction_code = 'Z1'
    AND restriction_type = 'Federal';

-- Convert existing LGCY_Z1 to a non-legacy restriction.
UPDATE
    sims.restrictions
SET
    restriction_code = 'Z1',
    is_legacy = false,
    description = 'Grant overaward. Not eligible for BCSL. Eligible for CSL.',
    restriction_category = 'BCSL Delinquency',
    notification_type = 'Error',
    action_type = ARRAY ['Stop full time BC funding'] :: sims.restriction_action_types [],
    updated_at = NOW(),
    modifier = (
        SELECT
            id
        FROM
            sims.users
        WHERE
            -- System user.
            user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system'
    )
WHERE
    restriction_code = 'LGCY_Z1'