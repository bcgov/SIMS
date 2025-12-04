-- Add "Out of Province Public" institution type
INSERT INTO
    institution_type(id, name)
VALUES
    (7, 'Out of Province Private');

-- Update existing "Out of Province" institution type to "Out of Province Public"
UPDATE
    institution_type
SET
    NAME = 'Out of Province Public'
WHERE
    id = 3;