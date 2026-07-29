INSERT INTO
  sims.report_configs (report_name, report_sql)
VALUES
  (
    'Ministry_Student_Applications_By_Institution_Report',
    $$-- student_assessments_total_amounts CTE is used to calculate the total assistance amount for each student assessment.
    WITH student_assessments_total_amounts AS (
      SELECT
        student_assessments.id AS student_assessment_id,
        SUM(disbursement_values.value_amount) AS total_assistance
      FROM
        sims.applications applications
        INNER JOIN sims.applications parent_applications ON parent_applications.id = applications.parent_application_id
        INNER JOIN sims.student_assessments student_assessments ON student_assessments.id = applications.current_assessment_id
        INNER JOIN sims.disbursement_schedules disbursement_schedules ON disbursement_schedules.student_assessment_id = student_assessments.id
        INNER JOIN sims.disbursement_values disbursement_values ON disbursement_values.disbursement_schedule_id = disbursement_schedules.id
        INNER JOIN sims.education_programs_offerings education_programs_offerings ON education_programs_offerings.id = student_assessments.offering_id
        INNER JOIN sims.education_programs education_programs ON education_programs.id = education_programs_offerings.program_id
        INNER JOIN sims.institution_locations institution_locations ON institution_locations.id = applications.location_id
      WHERE
        applications.application_status IN (
          'In Progress',
          'Assessment',
          'Enrolment',
          'Completed'
        )
        AND disbursement_values.value_type != 'BC Total Grant'
        -- The below criteria should be kept the same across all queries in this report.
        AND parent_applications.submitted_date BETWEEN :startDate
        AND :endDate
        AND education_programs_offerings.study_end_date >= :offeringEndDateMinDate
        AND applications.offering_intensity = ANY(:offeringIntensity)
        AND institution_locations.institution_id = :institution
        AND (
          :program = 0
          OR education_programs.id = :program
        )
      GROUP BY
        student_assessments.id
    ),
    -- application_with_disbursement_sent CTE is used to identify parent applications that have at least one disbursement sent.
    application_with_disbursement_sent AS (
      SELECT
        DISTINCT(applications.parent_application_id) AS parent_application_id
      FROM
        sims.applications applications
        INNER JOIN sims.applications parent_applications ON parent_applications.id = applications.parent_application_id
        INNER JOIN sims.student_assessments student_assessments ON student_assessments.id = applications.current_assessment_id
        INNER JOIN sims.disbursement_schedules disbursement_schedules ON disbursement_schedules.student_assessment_id = student_assessments.id
        INNER JOIN sims.education_programs_offerings education_programs_offerings ON education_programs_offerings.id = student_assessments.offering_id
        INNER JOIN sims.education_programs education_programs ON education_programs.id = education_programs_offerings.program_id
        INNER JOIN sims.institution_locations institution_locations ON institution_locations.id = applications.location_id
      WHERE
        -- Reject is also considered as sent, as the disbursement was sent, and later rejected.
        disbursement_schedules.disbursement_schedule_status IN ('Sent', 'Rejected')
        -- The below criteria should be kept the same across all queries in this report.
        AND parent_applications.submitted_date BETWEEN :startDate
        AND :endDate
        AND education_programs_offerings.study_end_date >= :offeringEndDateMinDate
        AND applications.offering_intensity = ANY(:offeringIntensity)
        AND institution_locations.institution_id = :institution
        AND (
          :program = 0
          OR education_programs.id = :program
        )
    )
    SELECT
      users.first_name AS "Student First Name",
      users.last_name AS "Student Last Name",
      sin_validations.sin AS "SIN",
      applications.student_number AS "Student Number",
      institutions.operating_name AS "Institution Operating Name",
      system_lookup_configurations_countries.lookup_value AS "Country",
      system_lookup_configurations_provinces.lookup_value AS "Province",
      institutions.classification AS "Classification",
      institutions.organization_status AS "Organization Status",
      institution_locations.name AS "Location Name",
      applications.application_number AS "Application Number",
      to_char(
        parent_applications.submitted_date AT TIME ZONE 'America/Vancouver',
        'YYYY-MM-DD HH24:MI:SS'
      ) AS "Original Submission",
      to_char(
        applications.submitted_date AT TIME ZONE 'America/Vancouver',
        'YYYY-MM-DD HH24:MI:SS'
      ) AS "Last Submission",
      cast(
        cast(student_assessments.assessment_date AS date) AS varchar
      ) AS "Assessment Date",
      applications.application_status AS "Application Status",
      CASE
        WHEN application_with_disbursement_sent.parent_application_id IS NULL THEN 'No'
        ELSE 'Yes'
      END AS "Disbursed",
      education_programs_offerings.offering_intensity AS "Study Intensity",
      education_programs.program_name AS "Program Name",
      education_programs.credential_type AS "Program Credential Type",
      education_programs.cip_code AS "CIP Code",
      education_programs_offerings.offering_name AS "Offering Name",
      cast(
        education_programs_offerings.study_start_date AS varchar
      ) AS "Study Start Date",
      cast(
        education_programs_offerings.study_end_date AS varchar
      ) AS "Study End Date",
      student_assessments_total_amounts.total_assistance AS "Total Assistance"
    FROM
      sims.applications applications
      INNER JOIN sims.applications parent_applications ON parent_applications.id = applications.parent_application_id
      INNER JOIN sims.students students ON students.id = applications.student_id
      INNER JOIN sims.sin_validations sin_validations ON sin_validations.id = students.sin_validation_id
      INNER JOIN sims.users users ON users.id = students.user_id
      INNER JOIN sims.student_assessments student_assessments ON student_assessments.id = applications.current_assessment_id
      INNER JOIN sims.education_programs_offerings education_programs_offerings ON education_programs_offerings.id = student_assessments.offering_id
      INNER JOIN sims.education_programs education_programs ON education_programs.id = education_programs_offerings.program_id
      INNER JOIN sims.institution_locations institution_locations ON institution_locations.id = applications.location_id
      INNER JOIN sims.institutions institutions ON institutions.id = institution_locations.institution_id
      LEFT JOIN application_with_disbursement_sent ON application_with_disbursement_sent.parent_application_id = applications.parent_application_id
      LEFT JOIN student_assessments_total_amounts ON student_assessments_total_amounts.student_assessment_id = student_assessments.id
      LEFT JOIN sims.system_lookup_configurations system_lookup_configurations_countries ON system_lookup_configurations_countries.lookup_category = 'Country'
      AND institutions.country = system_lookup_configurations_countries.lookup_key
      LEFT JOIN sims.system_lookup_configurations system_lookup_configurations_provinces ON system_lookup_configurations_provinces.lookup_category = 'Province'
      AND institutions.province = system_lookup_configurations_provinces.lookup_key
    WHERE
      applications.application_status IN (
        'In Progress',
        'Assessment',
        'Enrolment',
        'Completed'
      )
      -- The below criteria should be kept the same across all queries in this report.
      AND parent_applications.submitted_date BETWEEN :startDate
      AND :endDate
      AND education_programs_offerings.study_end_date >= :offeringEndDateMinDate
      AND applications.offering_intensity = ANY(:offeringIntensity)
      AND institution_locations.institution_id = :institution
      AND (
        :program = 0
        OR education_programs.id = :program
      )
    ORDER BY
      parent_applications.submitted_date ASC$$
  )