-- Update notification_types for the restriction code 12, O and PTWTHD.
UPDATE
    sims.restrictions
SET
    notification_type = 'Error'
WHERE
    restriction_code IN ('12', 'O', 'PTWTHD');