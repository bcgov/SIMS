INSERT INTO
  sims.report_configs (report_name, report_sql)
VALUES
  (
    'Ministry_Student_Unmet_Need_Report',
    'SELECT
      users.first_name AS "Student First Name",
      users.last_name AS "Student Last Name",
      sin_validations.sin AS "SIN",
      applications.student_number AS "Student Number",
      users.email AS "Student Email Address",
      students.contact_info ->> ''phone'' AS "Student Phone Number",
      institution_locations.institution_code AS "Institution Location Code",
      institution_locations.name AS "Institution Location Name",
      applications.application_number AS "Application Number",
      CAST(
        CAST(student_assessments.assessment_date AS date) AS varchar
      ) AS "Assessment Date",
      education_programs_offerings.offering_intensity AS "Study Intensity (PT or FT)",
      students.disability_status AS "Profile Disability Status",
      CASE
        WHEN student_assessments.workflow_data -> ''calculatedData'' ->> ''pdppdStatus'' = ''false'' THEN ''no''
        WHEN student_assessments.workflow_data -> ''calculatedData'' ->> ''pdppdStatus'' = ''true'' THEN ''yes''
      END AS "Application Disability Status",
      CAST(
        education_programs_offerings.study_start_date AS varchar
      ) AS "Study Start Date",
      CAST(
        education_programs_offerings.study_end_date AS varchar
      ) AS "Study End Date",
      education_programs.program_name AS "Program Name",
      education_programs.credential_type AS "Program Credential Type",
      education_programs.cip_code AS "CIP Code",
      education_programs.completion_years AS "Program Length",
      education_programs.sabc_code AS "SABC Program Code",
      education_programs_offerings.offering_name AS "Offering Name",
      education_programs_offerings.year_of_study AS "Year of Study",
      applications.data ->> ''indigenousStatus'' AS "Indigenous person status",
      applications.data ->> ''citizenship'' AS "Citizenship Status",
      applications.data ->> ''youthInCare'' AS "Youth in Care Flag",
      applications.data ->> ''custodyOfChildWelfare'' AS "Youth in Care beyond age 19",
      applications.relationship_status AS "Marital Status",
      applications.data ->> ''dependantstatus'' AS "Independant/Dependant",
      student_assessments.workflow_data -> ''calculatedData'' ->> ''totalEligibleDependents'' AS "Number of Eligible Dependants Total",
      CASE
        WHEN education_programs_offerings.offering_intensity = ''Part Time'' THEN student_assessments.assessment_data ->> ''totalAssessmentNeed''
        WHEN education_programs_offerings.offering_intensity = ''Full Time'' THEN student_assessments.assessment_data ->> ''totalAssessedCost''
      END AS "Federal/Provincial Assessed Costs",
      student_assessments.assessment_data ->> ''totalFederalAssessedResources'' AS "Federal Assessed Resources",
      student_assessments.assessment_data ->> ''federalAssessmentNeed'' AS "Federal assessed need",
      student_assessments.assessment_data ->> ''totalProvincialAssessedResources'' AS "Provincial Assessed Resources",
      student_assessments.assessment_data ->> ''provincialAssessmentNeed'' AS "Provincial assessed need",
      student_assessments.assessment_data ->> ''finalAwardTotal'' AS "Total assistance",
      student_assessments.assessment_data ->> ''finalFederalAwardNetCSGPAmount'' AS "Estimated CSGP",
      student_assessments.assessment_data ->> ''finalFederalAwardNetCSPTAmount'' AS "Estimated CSPT",
      student_assessments.assessment_data ->> ''finalFederalAwardNetCSGDAmount'' AS "Estimated CSGD",
      student_assessments.assessment_data ->> ''finalProvincialAwardNetBCAGAmount'' AS "Estimated BCAG",
      student_assessments.assessment_data ->> ''finalProvincialAwardNetSBSDAmount'' AS "Estimated SBSD",
      student_assessments.assessment_data ->> ''finalFederalAwardNetCSLPAmount'' AS "Estimated CSLP",
      student_assessments.assessment_data ->> ''finalProvincialAwardNetBCSLAmount'' AS "Estimated BCSL",
      student_assessments.assessment_data ->> ''finalFederalAwardNetCSGFAmount'' AS "Estimated CSGF",
      student_assessments.assessment_data ->> ''finalProvincialAwardNetBGPDAmount'' AS "Estimated BGPD"
    FROM
      sims.applications applications
      INNER JOIN sims.students students ON students.id = applications.student_id
      INNER JOIN sims.sin_validations sin_validations ON sin_validations.id = students.sin_validation_id
      INNER JOIN sims.users users ON users.id = students.user_id
      INNER JOIN sims.student_assessments student_assessments ON student_assessments.id = applications.current_assessment_id
      INNER JOIN sims.education_programs_offerings education_programs_offerings ON education_programs_offerings.id = student_assessments.offering_id
      INNER JOIN sims.education_programs education_programs ON education_programs.id = education_programs_offerings.program_id
      INNER JOIN sims.institution_locations institution_locations ON institution_locations.id = applications.location_id
    WHERE
      applications.application_status IN (''Assessment'', ''Enrolment'', ''Completed'')
      AND education_programs_offerings.offering_intensity = ANY(:offeringIntensity)
      AND applications.is_archived = FALSE
      AND (
        :sabcProgramCode = ''''
        OR education_programs.sabc_code = :sabcProgramCode
      )
      AND (
        :institution = 0
        OR institution_locations.institution_id = :institution
      )
      AND education_programs_offerings.study_start_date BETWEEN :startDate
      AND :endDate;'
  );