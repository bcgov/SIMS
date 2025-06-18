-- Add SSRN legacy map.
INSERT INTO
    sims.sfas_restriction_maps (legacy_code, code, is_legacy_only)
VALUES
    ('SSRN', 'LGCY_SSRN', TRUE);

-- Rename the existing SSRN back to LGCY_SSRN.
UPDATE
    sims.restrictions restrictions
SET
    restriction_code = 'LGCY_SSRN',
    is_legacy = TRUE,
    action_type = ARRAY ['Stop full time disbursement', 'Stop full time apply'] :: sims.restriction_action_types []
WHERE
    restriction_code = 'SSRN';

-- Remap LGCY_SSD to SSR.
-- Add SSRN legacy map.
INSERT INTO
    sims.sfas_restriction_maps (legacy_code, code, is_legacy_only)
VALUES
    ('SSRN', 'LGCY_SSRN', TRUE);

-- Delete the legacy LGCY_SSD map, if exists to ensure the insert can be executed.
DELETE FROM
    sims.sfas_restriction_maps
WHERE
    code = 'LGCY_SSD';

-- Insert the SSD map
-- TODO: must be checked from PROD values.
INSERT INTO
    sims.sfas_restriction_maps (legacy_code, code, is_legacy_only)
VALUES
    ('SSD', 'LGCY_SSD', TRUE);

-- Inert Z1 legacy map.
INSERT INTO
    sims.sfas_restriction_maps (legacy_code, code, is_legacy_only)
VALUES
    ('Z1', 'LGCY_Z1', TRUE);

-- Convert existing Z1 to a legacy restriction.
-- TODO: must be checked from PROD values.
UPDATE
    sims.restrictions
SET
    restriction_code = 'LGCY_Z1',
    is_legacy = TRUE,
    action_type = ARRAY ['Stop full time BC funding'] :: sims.restriction_action_types []
WHERE
    restriction_code = 'Z1';

-- Not adding Z1 back as federal restriction since it is not used and it was added as a mistake.