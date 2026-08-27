INSERT INTO
  sims.report_configs (report_name, report_sql)
VALUES
  (
    'Ministry_ATBC_Billing_Report',
    $$
    SELECT
      students_users.first_name AS "Given Name",
      students_users.last_name AS "Last Name",
      to_char(students.birth_date, 'YYYY-MM-DD') AS "Date Of Birth",
      form_submission_items.submitted_data ->> 'requestedDisabilityStatus' AS "Disability Status",
      form_submission_item_decisions.decision_status AS "Outcome",
      concat_ws(' ', aest_users.first_name, aest_users.last_name) AS "Completed By",
      to_char(form_submissions.assessed_date, 'YYYY-MM-DD') AS "Date Completed"
    FROM
	  sims.form_submission_items form_submission_items
      INNER JOIN sims.form_submissions form_submissions ON form_submission_items.form_submission_id = form_submissions.id
      INNER JOIN sims.form_submission_item_decisions form_submission_item_decisions ON form_submission_items.current_decision_id = form_submission_item_decisions.id
	  INNER JOIN sims.dynamic_form_configurations dynamic_form_configurations ON form_submission_items.dynamic_form_configuration_id = dynamic_form_configurations.id
      INNER JOIN sims.students students ON form_submissions.student_id = students.id
      INNER JOIN sims.users students_users ON students.user_id = students_users.id
      INNER JOIN sims.users aest_users ON form_submissions.assessed_by = aest_users.id
    WHERE
      dynamic_form_configurations.form_definition_name = 'disabilitystatusapplicationform'
      AND form_submissions.submission_status in ('Completed', 'Declined')
	  AND form_submissions.assessed_date::date between :startDate and :endDate
	ORDER BY form_submissions.assessed_date ASC$$
  )