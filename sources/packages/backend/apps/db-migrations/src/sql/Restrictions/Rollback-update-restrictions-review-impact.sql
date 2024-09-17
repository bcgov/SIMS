-- Revert the updates for the restriction code 5, 7 and 9.
UPDATE
    sims.restrictions
SET
    action_type = ARRAY ['Stop full time disbursement'] :: sims.restriction_action_types []
WHERE
    restriction_code IN ('5', '7', '9');

-- Revert the updates for the restriction code 12, O and PTWTHD.
UPDATE
    sims.restrictions
SET
    action_type = ARRAY ['Stop part time disbursement', 'Stop full time disbursement'] :: sims.restriction_action_types []
WHERE
    restriction_code IN ('12', 'O', 'PTWTHD');

-- Revert the updates for the restriction code APPC.
UPDATE
    sims.restrictions
SET
    restriction_code = 'APPC',
    action_type = ARRAY ['Stop full time disbursement', 'Stop part time disbursement'] :: sims.restriction_action_types []
WHERE
    restriction_code = 'HOLD';

-- Revert the updates for the restriction code B6
UPDATE
    sims.restrictions
SET
    restriction_type = 'Federal',
    description = 'Bankruptcy restriction on file prevent CSL/BCSL disbursements.',
    restriction_category = 'Federal'
WHERE
    restriction_code = 'B6';

-- Revert the updates for the restriction code B6A
UPDATE
    sims.restrictions
SET
    description = 'For reinstatement of your BCSL eligibility please complete an appeal.',
    action_type = ARRAY ['Stop full time BC funding'] :: sims.restriction_action_types []
WHERE
    restriction_code = 'B6A';

-- Revert the updates for the restriction code E2
UPDATE
    sims.restrictions
SET
    restriction_type = 'Federal',
    restriction_category = 'Federal'
WHERE
    restriction_code = 'E2';

-- Revert the updates for the restriction code PTSSR
UPDATE
    sims.restrictions
SET
    action_type = ARRAY ['Stop part time apply', 'Stop part time disbursement'] :: sims.restriction_action_types []
WHERE
    restriction_code = 'PTSSR';

-- Revert the updates for the restriction code SSR
UPDATE
    sims.restrictions
SET
    action_type = ARRAY ['Stop full time apply', 'Stop full time disbursement'] :: sims.restriction_action_types []
WHERE
    restriction_code = 'SSR';

-- Revert the updates for the restriction code RD
UPDATE
    sims.restrictions
SET
    action_type = ARRAY ['Stop part time disbursement', 'Stop full time disbursement'] :: sims.restriction_action_types []
WHERE
    restriction_code = 'RD';