-- Rollback script to update existing institutions with "Out of Province Public" type back to "Out of Province"
UPDATE
    institutions
SET
    institution_type_id = 3
WHERE
    institution_type_id = 7;

-- Rollback script to remove "Out of Province Public" institution type
DELETE FROM
    institution_type
WHERE
    id = 7;