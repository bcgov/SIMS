UPDATE
  sims.report_configs
SET
  report_sql = (
    'SELECT
      institutions.operating_name AS "Institution Operating Name",
      institution_locations.name AS "Location Name",
      institution_locations.institution_code AS "Location Code",
      institution_type.name AS "Institution Type",
      designation_agreements.designation_status AS "Designation Status",
      CAST(
        CAST(designation_agreements.assessed_date AS date) AS varchar
      ) AS "Assessed Date",
      CAST(designation_agreements.end_date AS varchar) AS "Expiry Date",
      designation_agreement_locations.requested AS "Request for designation",
      designation_agreement_locations.approved AS "Approved for designation",
      CONCAT(
        institution_locations.primary_contact ->> ''firstName'',
        '' '',
        institution_locations.primary_contact ->> ''lastName''
      ) AS "Location Contact",
      institution_locations.primary_contact ->> ''email'' AS "Contact Email"
    FROM
      sims.institution_locations institution_locations
      INNER JOIN sims.institutions institutions ON institution_locations.institution_id = institutions.id
      INNER JOIN sims.institution_type institution_type ON institution_type.id = institutions.institution_type_id
      INNER JOIN sims.designation_agreement_locations designation_agreement_locations ON designation_agreement_locations.location_id = institution_locations.id
      INNER JOIN sims.designation_agreements designation_agreements ON designation_agreements.id = designation_agreement_locations.designation_agreement_id
    WHERE
      designation_agreements.assessed_date between ((timestamp :startDate) AT TIME ZONE ''UTC'')
      and ((timestamp :endDate) AT TIME ZONE ''UTC'')
      OR designation_agreements.end_date BETWEEN ((timestamp :startDate) AT TIME ZONE ''UTC'')
      and ((timestamp :endDate) AT TIME ZONE ''UTC'')
    ORDER BY
      institutions.operating_name ASC,
      institution_locations.institution_code ASC,
      designation_agreements.designation_status ASC,
      designation_agreements.assessed_date DESC,
      designation_agreements.end_date DESC;'
  )
WHERE
  report_name = 'Institution_Designation_Report';