/*
 * Update BCSL overawards from SFAS integration to disbursement overawards table.
 */
UPDATE	sims.disbursement_overawards disbursement_overawards
SET		overaward_value = sfas_individuals.bcsl_overaward, 
		updated_at = NOW(),
		modifier = users.id
FROM 	sims.sfas_individuals sfas_individuals
		INNER JOIN sims.users users ON users.last_name = 'system-user'
WHERE 	disbursement_overawards.student_id = sfas_individuals.student_id
AND		disbursement_overawards.origin_type = 'Legacy overaward'
AND		disbursement_overawards.disbursement_value_code = 'BCSL';
