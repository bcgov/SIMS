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
      education_programs_offerings.offering_intensity AS "Offering Intensity",
      education_programs_offerings.course_load AS "Course Load",
      education_programs_offerings.offering_delivered AS "Delivery Type",
      education_programs_offerings.has_offering_wil_component AS "WIL Component",
      education_programs_offerings.offering_wil_type AS "WIL Component Type",
      CAST(education_programs_offerings.study_start_date AS varchar) AS "Start Date",
      CAST(education_programs_offerings.study_end_date AS varchar) AS "End Date",
      NOT education_programs_offerings.lacks_study_breaks AS "Has Study Breaks",
      education_programs_offerings.actual_tuition_costs AS "Actual Tuition",
      education_programs_offerings.program_related_costs AS "Program Related Costs",
      education_programs_offerings.mandatory_fees AS "Mandatory Fees",
      education_programs_offerings.exceptional_expenses AS "Exceptional Expenses",
      education_programs_offerings.offering_type AS "Offering Type",
      education_programs_offerings.offering_status AS "Status",
      education_programs_offerings.study_breaks ->> ''totalFundedWeeks'' AS "Funded Weeks",
      offerings_with_applications.total_applications AS "Total Applications"
    FROM
      sims.education_programs_offerings education_programs_offerings
    INNER JOIN sims.institution_locations institution_locations ON
      education_programs_offerings.location_id = institution_locations.id
    INNER JOIN sims.education_programs education_programs ON
      education_programs_offerings.program_id = education_programs.id
    INNER JOIN sims.program_years ON
      -- program year is used to merge the offerings and the program year table on the
      -- provided program year which is then used to filter the offerings belonging to
      -- the provided program year in the WHERE clause.  
      program_years.id = :programYear
    LEFT JOIN (
      -- Get all the offerings having at least one application in the given 
      -- Program year with their applications count satisfying the conditions
      -- from the WHERE clause.
      SELECT
        education_programs_offerings.id AS "id",
        COUNT(applications.id) AS "total_applications"
      FROM
        sims.education_programs_offerings education_programs_offerings
      INNER JOIN sims.institution_locations institution_locations ON
        education_programs_offerings.location_id = institution_locations.id
      INNER JOIN sims.student_assessments student_assessments ON
        education_programs_offerings.id = student_assessments.offering_id
      INNER JOIN sims.applications applications ON
        applications.current_assessment_id = student_assessments.id
      WHERE
        applications.program_year_id = :programYear
        AND education_programs_offerings.offering_intensity = ANY(:offeringIntensity)
          AND institution_locations.institution_id = :institutionId
          AND applications.application_status = ''Completed''
        GROUP BY
          education_programs_offerings.id) offerings_with_applications ON
      education_programs_offerings.id = offerings_with_applications."id"
    WHERE
      education_programs_offerings.offering_intensity = ANY(:offeringIntensity)
      AND education_programs_offerings.offering_type != ''Scholastic standing''
      AND institution_locations.institution_id = :institutionId
      AND education_programs_offerings.study_start_date BETWEEN program_years.start_date AND program_years.end_date
    ORDER BY
      institution_locations.institution_code,
      education_programs.program_name,
      education_programs_offerings.offering_name,
      education_programs_offerings.offering_intensity;'
  );