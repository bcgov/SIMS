-- Update action_type for the restriction code 5, 7 and 9.
UPDATE
    sims.restrictions
SET
    action_type = ARRAY ['Stop full time disbursement', 'Stop part time disbursement'] :: sims.restriction_action_types []
WHERE
    restriction_code IN ('5', '7', '9');

-- Update action_type for the restriction code 12, O and PTWTHD.
UPDATE
    sims.restrictions
SET
    action_type = ARRAY ['No effect'] :: sims.restriction_action_types []
WHERE
    restriction_code IN ('12', 'O', 'PTWTHD');

-- Update restriction_code, action_type for the restriction code APPC.
UPDATE
    sims.restrictions
SET
    restriction_code = 'HOLD',
    action_type = ARRAY ['Stop full time disbursement', 'Stop part time disbursement'] :: sims.restriction_action_types []
WHERE
    restriction_code = 'APPC';

-- Update restriction_type, description, restriction_category for the restriction code B6
UPDATE
    sims.restrictions
SET
    restriction_type = 'Provincial',
    description = 'Bankruptcy restriction on file prevent all funding.',
    restriction_category = 'Other'
WHERE
    restriction_code = 'B6';

-- Update description, action_type for the restriction code B6A
UPDATE
    sims.restrictions
SET
    description = 'For reinstatment of your BC funding eligibility please complete an appeal.',
    action_type = ARRAY ['Stop full time BC funding', 'Stop part time BC funding'] :: sims.restriction_action_types []
WHERE
    restriction_code = 'B6A';

-- Update restriction_type, restriction_category for the restriction code E2
UPDATE
    sims.restrictions
SET
    restriction_type = 'Provincial',
    restriction_category = 'Other'
WHERE
    restriction_code = 'E2';

-- Update action_type for the restriction code PTSSR
UPDATE
    sims.restrictions
SET
    action_type = ARRAY ['Stop part time disbursement'] :: sims.restriction_action_types []
WHERE
    restriction_code = 'PTSSR';

-- Update action_type for the restriction code SSR
UPDATE
    sims.restrictions
SET
    action_type = ARRAY ['Stop full time disbursement'] :: sims.restriction_action_types []
WHERE
    restriction_code = 'SSR';

-- Update action_type for the restriction code RD
UPDATE
    sims.restrictions
SET
    action_type = ARRAY ['Stop part time apply', 'Stop full time apply', 'Stop part time disbursement', 'Stop full time disbursement'] :: sims.restriction_action_types []
WHERE
    restriction_code = 'RD';