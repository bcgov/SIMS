--Insert config for daily disbursement report.
DELETE from
  sims.report_configs
WHERE
  report_name = 'Daily_Disbursement_File';