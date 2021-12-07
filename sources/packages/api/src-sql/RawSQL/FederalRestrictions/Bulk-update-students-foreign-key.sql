/*
 * After all the federal restrictions are imported, this update
 * associates all the students ids that matches with the students
 * currently on the database. This will be used for all subsequent
 * bulk operations to update the data on the table sims.student_restrictions.
 */
UPDATE
    sims.federal_restrictions
SET
    student_id = students.id
FROM
    sims.students students
    INNER JOIN sims.users users ON students.user_id = users.id
WHERE
    students.birth_date = sims.federal_restrictions.birth_date
    AND students.sin = sims.federal_restrictions.sin
    AND lower(users.last_name) = lower(sims.federal_restrictions.last_name)