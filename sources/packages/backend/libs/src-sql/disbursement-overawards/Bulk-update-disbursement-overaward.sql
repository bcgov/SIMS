/*
 * Update overawards from SFAS integration to disbursement overawards table.
 */
UPDATE
	sims.disbursement_overawards disbursement_overawards
SET
	overaward_value = CASE
		$3::text
		WHEN 'BCSL' THEN sfas_individuals.bcsl_overaward
		WHEN 'CSLF' THEN sfas_individuals.csl_overaward
	END,
	updated_at = NOW(),
	modifier = users.id
FROM
	sims.sfas_individuals sfas_individuals
	INNER JOIN sims.users users ON users.user_name = $1::text
	AND users.first_name IS NULL
WHERE
	disbursement_overawards.student_id = sfas_individuals.student_id
	AND disbursement_overawards.origin_type = $2::sims.disbursement_overaward_origin_types
	AND disbursement_overawards.disbursement_value_code = $3::text
	AND disbursement_overawards.overaward_value <> CASE
		$3::text
		WHEN 'BCSL' THEN sfas_individuals.bcsl_overaward
		WHEN 'CSLF' THEN sfas_individuals.csl_overaward
	END;