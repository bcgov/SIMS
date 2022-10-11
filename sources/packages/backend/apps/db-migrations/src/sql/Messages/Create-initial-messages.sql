-- Inserting initial values for 'messages table. This will be part of table creation migration. So, no drop migration sql, this data will destroy with table in drop migration
INSERT INTO
    sims.messages(id, description)
VALUES
    (1, 'Student File Upload');

INSERT INTO
    sims.messages(id, description)
VALUES
    (2, 'Ministry File Upload');