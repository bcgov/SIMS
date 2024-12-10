UPDATE
  sims.report_configs
SET
  report_sql = (
    'SELECT
      student_user.first_name AS "Student First Name",
      student_user.last_name AS "Student Last Name",
      sin_validation.sin AS "SIN",
      application.data ->> ''studentNumber'' AS "Student Number",
      student_user.email AS "Student Email Address",
      student.contact_info ->> ''phone'' AS "Student Phone Number",
      application.application_number AS "Application Number",
      TO_CHAR((assessment.assessment_date AT TIME ZONE ''America/Vancouver''), ''YYYY-MM-DD HH24:MI:SS'') AS "Assessment Date",
      program.program_name AS "Program Name",
      offering.offering_name AS "Offering Name",
      offering.offering_intensity AS "Study Intensity",
      student.disability_status AS "Profile Disability Status",
      assessment.workflow_data -> ''calculatedData'' ->> ''pdppdStatus'' AS "Application Disability Status",
      TO_CHAR(offering.study_start_date, ''YYYY-MM-DD'') AS "Study Start Date",
      TO_CHAR(offering.study_end_date, ''YYYY-MM-DD'') AS "Study End Date",
      disbursement.coe_status AS "COE Status",
      TO_CHAR((disbursement.coe_updated_at AT TIME ZONE ''America/Vancouver''), ''YYYY-MM-DD HH24:MI:SS'') AS "COE Actioned",
      disbursement.tuition_remittance_requested_amount AS "Remittance Requested",
      disbursement.tuition_remittance_effective_amount AS "Remittance Disbursed",
      (
        SELECT
          SUM(disbursement_value.value_amount)
        FROM
          sims.disbursement_values disbursement_value
        WHERE
          disbursement_value.disbursement_schedule_id = disbursement.id
          AND disbursement_value.value_code != ''BCSG''
      ) AS "Estimated Disbursement Amount",
      TO_CHAR(COALESCE(disbursement.date_sent, disbursement.disbursement_date), ''YYYY-MM-DD'') AS "Disbursement Date"
    FROM
      sims.disbursement_schedules disbursement
      INNER JOIN sims.student_assessments assessment ON disbursement.student_assessment_id = assessment.id
      INNER JOIN sims.education_programs_offerings offering ON assessment.offering_id = offering.id
      INNER JOIN sims.education_programs program ON offering.program_id = program.id
      INNER JOIN sims.applications application ON application.current_assessment_id = assessment.id
      INNER JOIN sims.students student ON application.student_id = student.id
      INNER JOIN sims.users student_user ON student.user_id = student_user.id
      INNER JOIN sims.sin_validations sin_validation ON student.sin_validation_id = sin_validation.id
    WHERE
      application.application_status IN (''Enrolment'', ''Completed'')
      AND application.is_archived = FALSE
      AND application.program_year_id = :programYear
      AND offering.offering_intensity = ANY(:offeringIntensity)
      AND program.institution_id = :institutionId
      AND disbursement.has_estimated_awards = TRUE
    ORDER BY
      CASE
        WHEN disbursement.coe_status = ''Required'' THEN 0
        WHEN disbursement.coe_status = ''Completed'' THEN 1
        ELSE 2
      END,
      disbursement.created_at;'
  )
WHERE
  report_name = 'COE_Requests';