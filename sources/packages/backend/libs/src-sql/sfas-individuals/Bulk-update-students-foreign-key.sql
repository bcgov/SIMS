/*
 * After all the SFAS individuals are imported, this update
 * associates all the students ids that matches with the students
 * currently on the database.
 */
UPDATE
    sims.sfas_individuals
SET
    student_id = students.id
FROM
    sims.students students
    INNER JOIN sims.users users ON students.user_id = users.id
    INNER JOIN sims.sin_validations sin_validations ON sin_validations.id = students.sin_validation_id
WHERE
    students.birth_date = sims.sfas_individuals.birth_date
    AND sin_validations.sin = sims.sfas_individuals.sin
    AND lower(users.last_name) = lower(sims.sfas_individuals.last_name)
    AND sims.sfas_individuals.student_id IS NULL;