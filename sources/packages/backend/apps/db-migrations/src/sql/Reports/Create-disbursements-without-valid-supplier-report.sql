INSERT INTO
  sims.report_configs (report_name, report_sql)
VALUES
  (
    'Disbursements_Without_Valid_Supplier_Report',
    'WITH greatest_cas_suppliers AS (
	    SELECT
	        student_id,
	        MAX(id) AS max_id
	    FROM
	        sims.cas_suppliers
	    GROUP BY
	        student_id
	),
	disbursement_sums AS (
	    SELECT
	        students.id AS student_id,
	        SUM(CASE WHEN dv.value_code = ''BCAG'' THEN dv.effective_amount ELSE 0 END) AS bcag_effective_amount,
	        SUM(CASE WHEN dv.value_code = ''SBSD'' THEN dv.effective_amount ELSE 0 END) AS sbsd_effective_amount,
	        SUM(CASE WHEN dv.value_code = ''BGPD'' THEN dv.effective_amount ELSE 0 END) AS bgpd_effective_amount
	    FROM
	        sims.students AS students
	    JOIN
	        sims.applications AS applications
	        ON applications.student_id = students.id
	    JOIN
	        sims.student_assessments AS student_assessments
	        ON applications.current_assessment_id = student_assessments.id
	    JOIN
	        sims.disbursement_schedules AS disbursement_schedules
	        ON student_assessments.id = disbursement_schedules.student_assessment_id
	        AND disbursement_schedules.disbursement_schedule_status = ''Sent''
          AND disbursement_schedules.date_sent between :startDate
          AND :endDate
	    JOIN
	        sims.cas_suppliers AS cas_suppliers
	        ON students.id = cas_suppliers.student_id
	    JOIN
	        greatest_cas_suppliers
	        ON greatest_cas_suppliers.student_id = cas_suppliers.student_id
	        AND greatest_cas_suppliers.max_id = cas_suppliers.id
	    LEFT JOIN
	        sims.disbursement_values AS dv
	        ON dv.disbursement_schedule_id = disbursement_schedules.id
	    WHERE
	        cas_suppliers.is_valid = false
	    GROUP BY
	        students.id
	)
	SELECT
	    users.first_name AS "Given Name",
	    users.last_name AS "Last Name",
	    sin_validations.sin AS "SIN",
	    users.identity_provider_type AS "Profile Type",
	    students.contact_info -> ''address'' ->> ''addressLine1'' AS "Address Line 1",
	    students.contact_info -> ''address'' ->> ''city'' AS "City",
	    students.contact_info -> ''address'' ->> ''provinceState'' AS "Province",
	    students.contact_info -> ''address'' ->> ''country'' AS "Country",
	    students.contact_info -> ''address'' ->> ''postalCode'' AS "Postal Code",
	    students.disability_status AS "Disability Status",
	    disbursement_sums.bcag_effective_amount AS "BCAG",
	    disbursement_sums.sbsd_effective_amount AS "SBSD",
	    disbursement_sums.bgpd_effective_amount AS "BGPD"
	FROM
	    disbursement_sums
	JOIN
	    sims.students AS students
	    ON students.id = disbursement_sums.student_id
	JOIN
	    sims.users AS users
	    ON students.user_id = users.id
	JOIN
	    sims.sin_validations AS sin_validations
	    ON students.sin_validation_id = sin_validations.id
  ORDER BY
      students.id;'
  );