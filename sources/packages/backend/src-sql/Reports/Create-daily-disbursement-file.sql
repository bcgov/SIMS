INSERT INTO
  sims.report_configs (report_name, report_sql)
VALUES
  (
    'Daily_Disbursement_File',
    'select
        sum(dr.total_disbursed_amount) as "BC Student Loan",
        sum(drv.grant_amount) as "BC Student Grant",
        (
          sum(dr.total_disbursed_amount) + sum(drv.grant_amount)
        ) as "BC Total",
        count(dr.id) as "Total Records"
      from
        sims.disbursement_receipts dr
        inner join sims.disbursement_receipt_values drv on dr.id = drv.disbursement_receipt_id
      where
        dr.batch_run_date = :batchRunDate
        and dr.funding_type = ''BC'''
  );