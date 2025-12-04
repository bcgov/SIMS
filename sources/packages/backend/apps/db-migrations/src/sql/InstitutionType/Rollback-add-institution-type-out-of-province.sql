-- Update existing institutions to use the old "Out of Province" institution type
UPDATE
    institutions
SET
    institution_type_id = 3
WHERE
    institution_type_id = 7;

-- Rollback script to remove "Out of Province Private" institution type
DELETE FROM
    institution_type
WHERE
    id = 7;

-- Update existing "Out of Province Public" institution type to "Out of Province"
UPDATE
    institution_type
SET
    NAME = 'Out of Province'
WHERE
    id = 3;