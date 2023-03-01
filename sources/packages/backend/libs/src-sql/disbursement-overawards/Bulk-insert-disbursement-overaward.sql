/*
 * Insert overawards from SFAS integration to disbursement overawards table where 
 * the overaward is different than 0. 
 */
INSERT INTO
	sims.disbursement_overawards(
		student_id,
		disbursement_value_code,
		overaward_value,
		origin_type,
		creator
	)
SELECT
	sfas_individuals.student_id,
	$1::text,
	CASE
		$1::text
		WHEN 'BCSL' THEN sfas_individuals.bcsl_overaward
		WHEN 'CSLF' THEN sfas_individuals.csl_overaward
	END,
	$2::sims.disbursement_overaward_origin_types,
	users.id
FROM
	sims.sfas_individuals sfas_individuals
	INNER JOIN sims.students students ON sfas_individuals.student_id = students.id
	INNER JOIN sims.users users ON users.user_name = $3::text
	AND users.first_name IS NULL
WHERE
	NOT EXISTS (
		SELECT
			1
		FROM
			sims.disbursement_overawards disbursement_overawards
		WHERE
			disbursement_overawards.student_id = students.id
			AND disbursement_overawards.disbursement_value_code = $1::text
			AND disbursement_overawards.origin_type = $2::sims.disbursement_overaward_origin_types
	)
	AND CASE
		$1::text
		WHEN 'BCSL' THEN sfas_individuals.bcsl_overaward <> 0
		WHEN 'CSLF' THEN sfas_individuals.csl_overaward <> 0
	END;