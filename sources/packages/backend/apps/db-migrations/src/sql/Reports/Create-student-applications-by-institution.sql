INSERT INTO
  sims.report_configs (report_name, report_sql)
VALUES
  (
    'Ministry_Student_Applications_By_Institution_Report',
    $$WITH application_with_assessment_sent AS (
      SELECT
        DISTINCT(applications.parent_application_id) AS parent_application_id
      FROM
        sims.applications applications
        INNER JOIN sims.applications parent_applications ON parent_applications.id = applications.parent_application_id
      		AND parent_applications.parent_application_id = parent_applications.id
        INNER JOIN sims.student_assessments student_assessments ON student_assessments.id = applications.current_assessment_id
        INNER JOIN sims.disbursement_schedules disbursement_schedules ON disbursement_schedules.student_assessment_id = student_assessments.id
        INNER JOIN sims.education_programs_offerings education_programs_offerings ON education_programs_offerings.id = student_assessments.offering_id
        INNER JOIN sims.education_programs education_programs ON education_programs.id = education_programs_offerings.program_id
        INNER JOIN sims.institution_locations institution_locations ON institution_locations.id = applications.location_id
      WHERE
        applications.application_status = 'Completed'
        AND applications.is_archived = false
        AND disbursement_schedules.disbursement_schedule_status = 'Sent'
        AND parent_applications.submitted_date BETWEEN :startDate AND :endDate
        AND applications.offering_intensity = ANY(:offeringIntensity)
        AND institution_locations.institution_id = :institution
        AND (:program = 0 OR education_programs.id = :program)
    )
    SELECT
      users.first_name AS "Student First Name",
      users.last_name AS "Student Last Name",
      sin_validations.sin AS "SIN",
      applications.student_number AS "Student Number",
      institutions.operating_name AS "Institution Operating Name",
      institutions.country AS "Country",
      institutions.province AS "Province",
      institutions.classification AS "Classification",
      institutions.organization_status AS "Organization Status",
      institution_locations.name AS "Location Name",
      applications.application_number AS "Application Number",
      to_char(parent_applications.submitted_date AT TIME ZONE 'America/Vancouver', 'YYYY-MM-DD HH24:MI:SS') AS "Original Submission",
      to_char(applications.submitted_date AT TIME ZONE 'America/Vancouver', 'YYYY-MM-DD HH24:MI:SS') AS "Last Submission",
      cast(cast(student_assessments.assessment_date AS date) AS varchar) AS "Assessment Date",
      applications.application_status AS "Application Status",
      CASE WHEN application_with_assessment_sent.parent_application_id IS NULL THEN 'No' ELSE 'Yes' END AS "Disbursed",
      education_programs_offerings.offering_intensity AS "Study Intensity",
      education_programs.program_name AS "Program Name",
      education_programs.credential_type AS "Program Credential Type",
      education_programs.cip_code AS "CIP Code",
      education_programs_offerings.offering_name AS "Offering Name",
      education_programs_offerings.offering_name AS "Offering Name",
      cast(education_programs_offerings.study_start_date AS varchar) AS "Study Start Date",
      cast(education_programs_offerings.study_end_date AS varchar) AS "Study End Date",
      CASE
        WHEN applications.offering_intensity = 'Part Time' THEN student_assessments.assessment_data ->> 'totalAssessmentNeed'
        WHEN applications.offering_intensity = 'Full Time' THEN student_assessments.assessment_data ->> 'totalAssessedCost'
      END AS "Total Assistance"
    FROM
      sims.applications applications
      INNER JOIN sims.applications parent_applications ON parent_applications.id = applications.parent_application_id
      AND parent_applications.parent_application_id = parent_applications.id
      INNER JOIN sims.students students ON students.id = applications.student_id
      INNER JOIN sims.sin_validations sin_validations ON sin_validations.id = students.sin_validation_id
      INNER JOIN sims.users users ON users.id = students.user_id
      INNER JOIN sims.student_assessments student_assessments ON student_assessments.id = applications.current_assessment_id
      INNER JOIN sims.education_programs_offerings education_programs_offerings ON education_programs_offerings.id = student_assessments.offering_id
      INNER JOIN sims.education_programs education_programs ON education_programs.id = education_programs_offerings.program_id
      INNER JOIN sims.institution_locations institution_locations ON institution_locations.id = applications.location_id
      INNER JOIN sims.institutions institutions ON institutions.id = institution_locations.institution_id
      LEFT JOIN application_with_assessment_sent ON application_with_assessment_sent.parent_application_id = applications.parent_application_id
    WHERE
      applications.application_status IN (
        'In Progress',
        'Assessment',
        'Enrolment',
        'Completed'
      )
      AND applications.is_archived = false
      AND parent_applications.submitted_date BETWEEN :startDate AND :endDate
      AND applications.offering_intensity = ANY(:offeringIntensity)
      AND institution_locations.institution_id = :institution
      AND (:program = 0 OR education_programs.id = :program)
    ORDER BY
      parent_applications.submitted_date ASC$$
  )