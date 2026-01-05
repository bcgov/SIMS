-- Rollback the disbursement report SQL to the previous version before the forecast date update.
UPDATE
  sims.report_configs
SET
  report_sql = $$ (
    SELECT
      to_char(dr.disburse_date, 'YYYY-MM-DD') AS "Date of Disbursement",
      dr.student_sin AS "SIN",
      app.application_number AS "Application Number",
      ds.document_number AS "Certificate Number",
      drv.grant_type AS "Funding Code",
      drv.grant_amount AS "Disbursement Amount"
    FROM
      sims.disbursement_receipts dr
      INNER JOIN sims.disbursement_receipt_values drv ON drv.disbursement_receipt_id = dr.id
      INNER JOIN sims.disbursement_schedules ds ON ds.id = dr.disbursement_schedule_id
      INNER JOIN sims.student_assessments sa ON sa.id = ds.student_assessment_id
      INNER JOIN sims.applications app ON app.id = sa.application_id
      INNER JOIN sims.education_programs_offerings epo ON epo.id = sa.offering_id
    WHERE
      epo.offering_intensity = ANY(:offeringIntensity)
      AND dr.disburse_date BETWEEN :startDate
      AND :endDate
    UNION
    ALL
    SELECT
      to_char(dr.disburse_date, 'YYYY-MM-DD') AS "Date of Disbursement",
      dr.student_sin AS "SIN",
      app.application_number AS "Application Number",
      ds.document_number AS "Certificate Number",
      dv.value_code AS "Funding Code",
      dv.effective_amount AS "Disbursement Amount"
    FROM
      sims.disbursement_receipts dr
      INNER JOIN sims.disbursement_receipt_values drv ON drv.disbursement_receipt_id = dr.id
      INNER JOIN sims.disbursement_schedules ds ON ds.id = dr.disbursement_schedule_id
      INNER JOIN sims.disbursement_values dv ON dv.disbursement_schedule_id = ds.id
      INNER JOIN sims.student_assessments sa ON sa.id = ds.student_assessment_id
      INNER JOIN sims.applications app ON app.id = sa.application_id
      INNER JOIN sims.education_programs_offerings epo ON epo.id = sa.offering_id
    WHERE
      epo.offering_intensity = ANY(:offeringIntensity)
      AND dr.funding_type <> 'FE'
      AND drv.grant_type = 'BCSG'
      AND dv.value_type = 'BC Grant'
      AND dr.disburse_date BETWEEN :startDate
      AND :endDate
    UNION
    ALL
    SELECT
      to_char(dr.disburse_date, 'YYYY-MM-DD') AS "Date of Disbursement",
      dr.student_sin AS "SIN",
      app.application_number AS "Application Number",
      ds.document_number AS "Certificate Number",
      CASE
        WHEN dr.funding_type = 'BC' THEN 'BCSL'
        WHEN dr.funding_type = 'FE' THEN 'CSL'
      END AS "Funding Code",
      dr.total_disbursed_amount AS "Disbursement Amount"
    FROM
      sims.disbursement_receipts dr
      INNER JOIN sims.disbursement_schedules ds ON ds.id = dr.disbursement_schedule_id
      INNER JOIN sims.student_assessments sa ON sa.id = ds.student_assessment_id
      INNER JOIN sims.applications app ON app.id = sa.application_id
      INNER JOIN sims.education_programs_offerings epo ON epo.id = sa.offering_id
    WHERE
      epo.offering_intensity = ANY(:offeringIntensity)
      AND dr.disburse_date BETWEEN :startDate
      AND :endDate
  )
ORDER BY
  "Date of Disbursement",
  "Certificate Number" $$
WHERE
  report_name = 'Disbursement_Report';