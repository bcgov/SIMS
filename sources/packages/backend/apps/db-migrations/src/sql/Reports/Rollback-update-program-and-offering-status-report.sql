UPDATE
  sims.report_configs
SET
  report_sql = (
    'WITH offerings_dataset AS (
      SELECT
        institution_locations.name AS "Institution Location Name",
        education_programs.id AS "program_id",
        education_programs.program_name AS "Program Name",
        education_programs.sabc_code AS "SABC Program Code",
        education_programs.regulatory_body AS "Regulatory Body",
        education_programs.credential_type AS "Credential Type",
        education_programs.completion_years AS "Program Length",
        CASE
          WHEN (
            education_programs.delivered_on_site = true
            AND education_programs.delivered_online = true
          ) THEN ''Blended''
          WHEN education_programs.delivered_on_site = true THEN ''On-site''
          WHEN education_programs.delivered_online = true THEN ''Online''
        END AS "Delivery",
        education_programs.course_load_calculation AS "Credit or Hours",
        education_programs.program_status AS "Program Status",
        CASE
          WHEN education_programs.is_active = true THEN false
          WHEN education_programs.is_active = false THEN true
        END AS "Program Deactivated?",
        education_programs.effective_end_date AS "Program Expiry Date",
        education_programs_offerings.offering_name AS "Offering Name",
        CAST(
          education_programs_offerings.study_start_date AS varchar
        ) AS "Study Start Date",
        CAST(
          education_programs_offerings.study_end_date AS varchar
        ) AS "Study End Date",
        education_programs_offerings.year_of_study AS "Year of Study",
        education_programs_offerings.offering_type AS "Offering Type",
        education_programs_offerings.offering_status AS "Offering Status",
        education_programs_offerings.offering_intensity AS "Offering Intensity"
      FROM
        sims.education_programs education_programs
        LEFT JOIN sims.education_programs_offerings education_programs_offerings ON education_programs.id = education_programs_offerings.program_id
        INNER JOIN sims.institution_locations institution_locations ON education_programs_offerings.location_id = institution_locations.id
        INNER JOIN sims.institutions institutions ON institution_locations.institution_id = institutions.id
      WHERE
        institutions.id = :institution
        AND (
          education_programs_offerings.study_start_date BETWEEN :startDate
          AND :endDate
        )
        AND education_programs_offerings.offering_intensity = ANY(:offeringIntensity)
        AND (
          :sabcProgramCode = ''''
          OR education_programs.sabc_code = :sabcProgramCode
        )
        AND CASE
          WHEN array [''Part Time''] :: sims.offering_intensity [] = :offeringIntensity :: sims.offering_intensity [] THEN education_programs.program_intensity = ''Full Time and Part Time''
          WHEN array [''Full Time''] :: sims.offering_intensity [] = :offeringIntensity :: sims.offering_intensity [] THEN education_programs.program_intensity = ''Full Time''
          ELSE education_programs.program_intensity IN (''Full Time'', ''Full Time and Part Time'')
        END
    )
    SELECT
      "Institution Location Name",
      "Program Name",
      "SABC Program Code",
      "Regulatory Body",
      "Credential Type",
      "Program Length",
      "Delivery",
      "Credit or Hours",
      "Program Status",
      "Program Deactivated?",
      "Program Expiry Date",
      "Offering Name",
      "Study Start Date",
      "Study End Date",
      "Year of Study",
      "Offering Type",
      "Offering Status",
      "Offering Intensity"
    FROM
      offerings_dataset
    UNION
    ALL
    SELECT
      institution_locations.name AS "Institution Location Name",
      education_programs.program_name AS "Program Name",
      education_programs.sabc_code AS "SABC Program Code",
      education_programs.regulatory_body AS "Regulatory Body",
      education_programs.credential_type AS "Credential Type",
      education_programs.completion_years AS "Program Length",
      CASE
        WHEN (
          education_programs.delivered_on_site = true
          AND education_programs.delivered_online = true
        ) THEN ''Blended''
        WHEN education_programs.delivered_on_site = true THEN ''On-site''
        WHEN education_programs.delivered_online = true THEN ''Online''
      END AS "Delivery",
      education_programs.course_load_calculation AS "Credit or Hours",
      education_programs.program_status AS "Program Status",
      CASE
        WHEN education_programs.is_active = true THEN false
        WHEN education_programs.is_active = false THEN true
      END AS "Program Deactivated?",
      education_programs.effective_end_date AS "Program Expiry Date",
      NULL AS "Offering Name",
      NULL AS "Study Start Date",
      NULL AS "Study End Date",
      NULL AS "Year of Study",
      NULL AS "Offering Type",
      NULL AS "Offering Status",
      NULL AS "Offering Intensity"
    FROM
      sims.education_programs education_programs
      INNER JOIN sims.institutions institutions ON education_programs.institution_id = institutions.id
      INNER JOIN sims.institution_locations institution_locations ON institution_locations.institution_id = institutions.id
    WHERE
      institutions.id = :institution
      AND (
        :sabcProgramCode = ''''
        OR education_programs.sabc_code = :sabcProgramCode
      )
      AND education_programs.program_status IN (''Approved'', ''Pending'')
      AND (
        education_programs.is_active = true
        OR (
          education_programs.is_active = false
          AND education_programs.is_active_updated_on >= :startDate
        )
      )
      AND (
        education_programs.effective_end_date IS NULL
        OR education_programs.effective_end_date >= :startDate
      )
      AND CASE
        WHEN array [''Part Time''] :: sims.offering_intensity [] = :offeringIntensity :: sims.offering_intensity [] THEN education_programs.program_intensity = ''Full Time and Part Time''
        WHEN array [''Full Time''] :: sims.offering_intensity [] = :offeringIntensity :: sims.offering_intensity [] THEN education_programs.program_intensity = ''Full Time''
        ELSE education_programs.program_intensity IN (''Full Time'', ''Full Time and Part Time'')
      END
      AND education_programs.id NOT IN (
        SELECT
          "program_id"
        FROM
          offerings_dataset
      )
    ORDER BY
      "Institution Location Name",
      "Program Name",
      "Offering Name",
      "Offering Intensity";'
  )
WHERE
  report_name = 'Program_And_Offering_Status_Report';