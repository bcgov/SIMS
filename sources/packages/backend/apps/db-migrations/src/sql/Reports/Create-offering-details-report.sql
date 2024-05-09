INSERT INTO
  sims.report_configs (report_name, report_sql)
VALUES
  (
    'Offering_Details_Report',
    'SELECT
      institution_locations.institution_code AS "Institution Location Code",
      education_programs.program_name AS "Program",
      education_programs.sabc_code AS "SABC Program Code",
      education_programs_offerings.offering_name AS "Offering Name",
      education_programs_offerings.year_of_study AS "Year of Study",
      education_programs_offerings."offering_intensity" AS "Offering Intensity",
      education_programs_offerings.course_load AS "Course Load",
      education_programs_offerings.offering_delivered AS "Delivery Type",
      education_programs_offerings.has_offering_wil_component AS "WIL Component",
      education_programs_offerings.offering_wil_type AS "WIL Component Type",
      education_programs_offerings.study_start_date AS "Start Date",
      education_programs_offerings.study_end_date AS "End Date",
      NOT education_programs_offerings.lacks_study_breaks AS "Has Study Breaks",
      COALESCE(education_programs_offerings.actual_tuition_costs,
      0) AS "Actual Tuition",
      COALESCE(education_programs_offerings.program_related_costs,
      0) AS "Program Related Costs",
      COALESCE(education_programs_offerings.mandatory_fees,
      0) AS "Mandatory Fees",
      COALESCE(education_programs_offerings.exceptional_expenses,
      0) AS "Exceptional Expenses",
      education_programs_offerings.offering_type AS "Public Offering",
      education_programs_offerings."offering_status" AS "Status",
      COALESCE((education_programs_offerings.study_breaks ->> ''totalFundedWeeks'')::INTEGER,
      0) AS "Funded Weeks",
      COALESCE(offerings_with_applications."Total Applications",
      0)
    FROM
      sims.education_programs_offerings education_programs_offerings
    INNER JOIN sims.institution_locations institution_locations ON
      education_programs_offerings.location_id = institution_locations.id
    INNER JOIN sims.education_programs education_programs ON
      education_programs_offerings.program_id = education_programs.id
    INNER JOIN sims.program_years ON
      program_years.id = :programYear
    LEFT JOIN (
      SELECT
        education_programs_offerings.id AS "ID",
        COUNT(applications.id) AS "Total Applications"
      FROM
        sims.education_programs_offerings education_programs_offerings
      INNER JOIN sims.institution_locations institution_locations ON
        education_programs_offerings.location_id = institution_locations.id
      INNER JOIN sims.student_assessments student_assessments ON
        education_programs_offerings.id = student_assessments.offering_id
      INNER JOIN sims.applications applications ON
        applications.current_assessment_id = student_assessments.id
      INNER JOIN sims.program_years program_years ON
        applications.program_year_id = program_years.id
      WHERE
        program_years.id = :programYear
        AND education_programs_offerings.offering_intensity = ANY(:offeringIntensity)
          AND institution_locations.institution_id = :institutionId
        GROUP BY
          education_programs_offerings.id) offerings_with_applications ON
      education_programs_offerings.id = offerings_with_applications."ID"
    WHERE
      education_programs_offerings.offering_intensity = ANY(:offeringIntensity)
      AND institution_locations.institution_id = :institutionId
      AND education_programs_offerings.study_start_date BETWEEN program_years.start_date AND program_years.end_date
    ORDER BY
      institution_locations.institution_code,
      education_programs.program_name,
      education_programs_offerings.offering_name,
      education_programs_offerings."offering_intensity";'
  );