-- Update BCLM to block only full-time BC loan, introducing the new behavior required in the ticket.
UPDATE
    sims.restrictions
SET
    action_type = ARRAY ['Stop full-time BC loan'] :: sims.restriction_action_types []
WHERE
    restriction_code = 'BCLM';

-- Update B2D, B3D, B2, and Z1 restrictions to stop all full-time BC funding, keeping existing behavior.
UPDATE
    sims.restrictions
SET
    action_type = ARRAY ['Stop full-time BC loan', 'Stop full-time BC grants'] :: sims.restriction_action_types []
WHERE
    restriction_code IN ('B2D', 'B3D', 'B2', 'Z1');

-- Update B6A restriction to stop all BC funding for both full-time and part-time disbursements, keeping existing behavior.
-- Please note, part-time does not include loans as they are not offered for part-time students.
UPDATE
    sims.restrictions
SET
    action_type = ARRAY ['Stop full-time BC loan', 'Stop full-time BC grants', 'Stop part-time BC grants'] :: sims.restriction_action_types []
WHERE
    restriction_code = 'B6A';