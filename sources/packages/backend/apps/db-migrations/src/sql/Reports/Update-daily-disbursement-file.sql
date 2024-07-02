UPDATE
  sims.report_configs
SET
  report_name = 'Provincial_Daily_Disbursement_File',
  report_sql = (
    'WITH disbursement_receipts_dataset AS (
      SELECT
        *
      FROM
        sims.disbursement_receipts disbursement_receipts
      WHERE
        disbursement_receipts.funding_type IN (''BC'', ''BP'')
        AND disbursement_receipts.batch_run_date = :batchRunDate
    )
    SELECT
      SUM(disbursement_receipts."FT BC Student Loan") AS "FT BC Student Loan",
      SUM(disbursement_receipts."FT BC Student Grant") AS "FT BC Student Grant",
      SUM(disbursement_receipts."FT BC Total") AS "FT BC Total",
      SUM(disbursement_receipts."PT BC Student Grant") AS "PT BC Student Grant",
      SUM(disbursement_receipts."PT BC Total") AS "PT BC Total",
      SUM(disbursement_receipts."Total Records") AS "Total Records"
    FROM
      (
        SELECT
          SUM(
            full_time_disbursement_receipts.total_disbursed_amount
          ) AS "FT BC Student Loan",
          SUM(
            full_time_disbursement_receipts.total_disbursed_grant_amount
          ) AS "FT BC Student Grant",
          SUM(
            full_time_disbursement_receipts.total_disbursed_amount
          ) AS "FT BC Total",
          0 AS "PT BC Student Grant",
          0 AS "PT BC Total",
          COUNT(full_time_disbursement_receipts.id) AS "Total Records"
        FROM
          disbursement_receipts_dataset full_time_disbursement_receipts
        WHERE
          full_time_disbursement_receipts.funding_type = ''BC''
          AND full_time_disbursement_receipts.batch_run_date = :batchRunDate
        UNION
        ALL
        SELECT
          0 AS "FT BC Student Loan",
          0 AS "FT BC Student Grant",
          0 AS "FT BC Total",
          SUM(
            part_time_disbursement_receipts.total_disbursed_grant_amount
          ) AS "PT BC Student Grant",
          SUM(
            part_time_disbursement_receipts.total_disbursed_amount
          ) AS "PT BC Total",
          COUNT(part_time_disbursement_receipts.id) AS "Total Records"
        FROM
          disbursement_receipts_dataset part_time_disbursement_receipts
        WHERE
          part_time_disbursement_receipts.funding_type = ''BP''
          AND part_time_disbursement_receipts.batch_run_date = :batchRunDate
      ) AS disbursement_receipts;'
  )
WHERE
  report_name = 'Daily_Disbursement_File';