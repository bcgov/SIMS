INSERT INTO
  sims.report_configs (report_name, report_sql)
VALUES
  (
    'Offering_Details_Report',
    'SELECT
	institution_locations.institution_code AS "Institution Location Code",
	education_programs.program_name AS "Program",
	education_programs.sabc_code AS "SABC Program Code",
	offering."Offering Name",
	offering."Year of Study",
	offering."Offering Intensity",
	offering."Course Load",
	offering."Delivery Type",
	offering."WIL Component",
	offering."WIL Component Type",
	offering."Start Date",
	offering."End Date",
	offering."Has Study Breaks",
	offering."Actual Tuition",
	offering."Program Related Costs",
	offering."Mandatory Fees",
	offering."Exceptional Expenses",
	offering."Public Offering",
	offering."Status",
	offering."Funded Weeks",
	offering."Total Applications"
FROM
	(
	SELECT
		education_programs_offerings.id AS "ID",
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
		education_programs_offerings.actual_tuition_costs AS "Actual Tuition",
		education_programs_offerings.program_related_costs AS "Program Related Costs",
		education_programs_offerings.mandatory_fees AS "Mandatory Fees",
		education_programs_offerings.exceptional_expenses AS "Exceptional Expenses",
		education_programs_offerings.offering_type AS "Public Offering",
		education_programs_offerings."offering_status" AS "Status",
		education_programs_offerings.study_breaks ->> ''totalFundedWeeks'' AS "Funded Weeks",
		COUNT(applications.id) AS "Total Applications",
		education_programs_offerings.location_id AS "Location ID",
		education_programs_offerings.program_id AS "Program ID"
	FROM
		sims.education_programs_offerings education_programs_offerings
	LEFT JOIN sims.student_assessments student_assessments ON
		education_programs_offerings.id = student_assessments.offering_id
	LEFT JOIN sims.applications applications ON
		applications.id = student_assessments.application_id
	LEFT JOIN sims.program_years program_years ON
		applications.program_year_id = program_years.id
	WHERE
		program_years.id = :programYear
		AND education_programs_offerings.offering_intensity = ANY(:offeringIntensity)
	GROUP BY
		education_programs_offerings.id) offering
INNER JOIN sims.institution_locations institution_locations ON
	offering."Location ID" = institution_locations.id
INNER JOIN sims.education_programs education_programs ON
	offering."Program ID" = education_programs.id
WHERE
	institution_locations.institution_code IN (
	SELECT
		institution_locations.institution_code
	FROM
		sims.institution_locations
	WHERE
		institution_locations.institution_id = :institutionId);'
  );