UPDATE
    sims.report_configs
SET
    report_sql = 
  $$SELECT
        institutions.operating_name AS "Institution Operating Name",
        institution_locations.name AS "Location Name",
        institution_locations.institution_code AS "Location Code",
        institutions.classification AS "Classification",
        institutions.organization_status AS "Organization Status",
        institutions.medical_school_status AS "Medical",
        country_lookup.lookup_value AS "Country",
        province_lookup.lookup_value AS "Province",
        designation_agreements.designation_status AS "Designation Status",
        CAST(
            CAST(designation_agreements.assessed_date AS date) AS varchar
        ) AS "Assessed Date",
        CAST(designation_agreements.end_date AS varchar) AS "Expiry Date",
        designation_agreement_locations.requested AS "Request for designation",
        designation_agreement_locations.approved AS "Approved for designation",
        CONCAT(
            institution_locations.primary_contact ->> 'firstName',
            ' ',
            institution_locations.primary_contact ->> 'lastName'
        ) AS "Location Contact",
        institution_locations.primary_contact ->> 'email' AS "Contact Email"
    FROM
        sims.institution_locations institution_locations
        INNER JOIN sims.institutions institutions ON institution_locations.institution_id = institutions.id
        INNER JOIN sims.designation_agreement_locations designation_agreement_locations ON designation_agreement_locations.location_id = institution_locations.id
        INNER JOIN sims.designation_agreements designation_agreements ON designation_agreements.id = designation_agreement_locations.designation_agreement_id
        LEFT JOIN sims.system_lookup_configurations country_lookup ON country_lookup.lookup_category = 'Country'
        AND country_lookup.lookup_key = institutions.country
        LEFT JOIN sims.system_lookup_configurations province_lookup ON province_lookup.lookup_category = 'Province'
        AND province_lookup.lookup_key = institutions.province
    WHERE
        (
            designation_agreements.assessed_date >= CAST(:startDate AS timestamptz)
            AND designation_agreements.assessed_date < CAST(:endDate AS timestamptz) + INTERVAL '1 DAY'
        )
        OR (
            designation_agreements.end_date >= CAST(:startDate AS timestamptz)
            AND designation_agreements.end_date < CAST(:endDate AS timestamptz) + INTERVAL '1 DAY'
        )
    ORDER BY
        institutions.operating_name ASC,
        institution_locations.institution_code ASC,
        designation_agreements.designation_status ASC,
        designation_agreements.assessed_date DESC,
        designation_agreements.end_date DESC;$$
WHERE
    report_name = 'Institution_Designation_Report';