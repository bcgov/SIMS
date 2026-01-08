-- The 'Stop full-time BC grants' will be converted to previous 'Stop full time BC funding'.
-- Please note, BCLM should be taken care once the types are converted back.
UPDATE
    sims.restrictions
SET
    action_type = ARRAY ['Stop full-time BC grants'] :: sims.restriction_action_types []
WHERE
    restriction_code IN ('B2D', 'B3D', 'B2', 'Z1');

-- The 'Stop full-time BC grants' and 'Stop part-time BC grants' will be converted
-- to previous 'Stop full time BC funding' and 'Stop part time BC funding' respectively.
UPDATE
    sims.restrictions
SET
    action_type = ARRAY ['Stop full-time BC grants','Stop part-time BC grants'] :: sims.restriction_action_types []
WHERE
    restriction_code = 'B6A';