/*
 * Insert BCSL overawards from SFAS integration to disbursement overawards table where 
 * the overard is different than 0. 
 */
INSERT INTO sims.disbursement_overawards(
		student_id,
		disbursement_value_code,
		overaward_value,
		origin_type,
		creator) 
SELECT	sfas_individuals.student_id, 
	   	E'BCSL', 
	   	sfas_individuals.bcsl_overaward, 
		E'Legacy overaward',
		users.id
FROM 	sims.sfas_individuals sfas_individuals
		INNER JOIN sims.students students ON sfas_individuals.student_id = students.id
		INNER JOIN sims.users users ON users.last_name = 'system-user'
WHERE 	NOT EXISTS (
		SELECT 	1 
		FROM 	sims.disbursement_overawards disbursement_overawards
		WHERE 	disbursement_overawards.student_id = students.id
		AND 	disbursement_overawards.disbursement_value_code = 'BCSL'
		AND 	disbursement_overawards.origin_type = 'Legacy overaward'
)
AND		sfas_individuals.bcsl_overaward <> 0;




