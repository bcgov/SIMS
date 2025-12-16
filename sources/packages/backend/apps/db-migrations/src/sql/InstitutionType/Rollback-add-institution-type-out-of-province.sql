-- Update existing institutions to use the old "Out of Province" institution type
UPDATE
    sims.institutions
SET
    institution_type_id = 3
WHERE
    institution_type_id = 7;

-- Rollback script to remove "Out of Province Private" institution type
DELETE FROM
    sims.institution_type
WHERE
    id = 7;

-- Update existing "Out of Province Public" institution type to "Out of Province"
UPDATE
    sims.institution_type
SET
    NAME = 'Out of Province'
WHERE
    id = 3;