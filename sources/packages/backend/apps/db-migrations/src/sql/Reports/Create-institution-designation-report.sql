INSERT INTO
  sims.report_configs (report_name, report_sql)
VALUES
  (
    'Institution_Designation_Report',
    'SELECT
      institutions.operating_name,
      institution_locations.name,
      institution_locations.institution_code,
      institution_type.name,
      CASE
        WHEN designation_agreements.designation_status = ''Pending'' THEN ''Pending''
        WHEN (designation_agreements.designation_status = ''Declined''
        OR (designation_agreements.designation_status = ''Approved''
        AND designation_agreement_locations.approved = FALSE)) THEN ''Declined''
        WHEN designation_agreements.designation_status = ''Approved''
        AND designation_agreement_locations.approved = TRUE THEN ''Approved''
      END "Designation Status",
      designation_agreements.assessed_date,
      designation_agreements.end_date,
      institution_locations.primary_contact ->> ''firstName'' AS "Location Contact",
      institution_locations.primary_contact ->> ''email'' AS "Contact Email"
    FROM
        sims.institution_locations institution_locations
    INNER JOIN sims.institutions institutions ON
      institution_locations.institution_id = institutions.id
    INNER JOIN sims.institution_type institution_type ON
      institution_type.id = institutions.institution_type_id
    INNER JOIN sims.designation_agreement_locations designation_agreement_locations ON
        designation_agreement_locations.location_id = institution_locations.id
    INNER JOIN sims.designation_agreements designation_agreements ON
        designation_agreements.id = designation_agreement_locations.designation_agreement_id
    WHERE
        institution_locations.institution_id = :institutionId
      AND designation_agreements.assessed_date BETWEEN :startDate AND :endDate
      OR designation_agreements.end_date BETWEEN :startDate AND :endDate;'
  );