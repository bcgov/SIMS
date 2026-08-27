INSERT INTO
  sims.report_configs (report_name, report_sql)
VALUES
  (
    'Ministry_ATBC_Billing_Report',
    $$
    SELECT
      u.first_name AS "Given name",
      u.last_name AS "Last name",
      to_char(s.birth_date, 'YYYY-MM-DD') AS "Date of birth",
      submitted_data ->> 'requestedDisabilityStatus' AS "PD or PPD status",
      fsid.decision_status AS "Outcome",
      concat_ws(' ', au.first_name, au.last_name) AS "Completed by",
      to_char(fs.assessed_date, 'YYYY-MM-DD') AS "Date completed"
    FROM
      sims.form_submissions fs
      INNER JOIN sims.form_submission_items fsi ON fs.id = fsi.form_submission_id
      INNER JOIN sims.form_submission_item_decisions fsid ON fsi.current_decision_id = fsid.id
      INNER JOIN sims.students s ON fs.student_id = s.id
      INNER JOIN sims.users u ON s.user_id = u.id
      INNER JOIN sims.users au ON fs.assessed_by = au.id
      INNER JOIN sims.dynamic_form_configurations dfc ON fsi.dynamic_form_configuration_id = dfc.id
    WHERE
      dfc.form_definition_name = 'disabilitystatusapplicationform'
      AND fs.submission_status = 'Completed'
	  AND fs.assessed_date between :startDate and :endDate
	ORDER BY fs.assessed_date ASC $$
  )