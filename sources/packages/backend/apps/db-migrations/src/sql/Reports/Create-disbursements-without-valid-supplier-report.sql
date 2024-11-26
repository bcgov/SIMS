INSERT INTO
  sims.report_configs (report_name, report_sql)
VALUES
  (
    'Disbursements_Without_Valid_Supplier_Report',
    'SELECT
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
      SUM(
        CASE
          WHEN disbursement_values.value_code = ''BCAG'' THEN disbursement_values.effective_amount
          ELSE 0
        END
      ) AS "BCAG",
      SUM(
        CASE
          WHEN disbursement_values.value_code = ''SBSD'' THEN disbursement_values.effective_amount
          ELSE 0
        END
      ) AS "SBSD",
      SUM(
        CASE
          WHEN disbursement_values.value_code = ''BGPD'' THEN disbursement_values.effective_amount
          ELSE 0
        END
      ) AS "BGPD"
    FROM
      sims.students students
      INNER JOIN sims.users users ON students.user_id = users.id
      INNER JOIN sims.sin_validations sin_validations ON students.id = sin_validations.student_id
      INNER JOIN sims.cas_suppliers cas_suppliers ON cas_suppliers.student_id = students.id
      INNER JOIN sims.applications applications ON applications.student_id = students.id
      INNER JOIN sims.student_assessments student_assessments ON student_assessments.application_id = applications.id
      LEFT JOIN sims.disbursement_schedules disbursement_schedules ON disbursement_schedules.student_assessment_id = student_assessments.id
      INNER JOIN sims.disbursement_values disbursement_values ON disbursement_values.disbursement_schedule_id = disbursement_schedules.id
    WHERE
      disbursement_schedules.disbursement_schedule_status = ''Sent''
      AND disbursement_schedules.date_sent BETWEEN :startDate
      AND :endDate
      AND cas_suppliers.is_valid = false
    GROUP BY
      users.id,
      sin_validations.sin,
      students.contact_info,
      students.disability_status;'
  );