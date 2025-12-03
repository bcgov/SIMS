-- Add "Out of Province Public" institution type
INSERT INTO
    institution_type(id, name)
VALUES
    (7, 'Out of Province Public');

-- Migrate existing institutions with "Out of Province" type to "Out of Province Public"
UPDATE
    institutions
SET
    institution_type_id = 7
WHERE
    institution_type_id = 3;