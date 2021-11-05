CREATE TABLE IF NOT EXISTS sims.sfas_applications (
  id INT PRIMARY KEY,
  individual_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  program_year_id INT NOT NULL,
  bsl_award NUMERIC(8, 2),
  csl_award NUMERIC(8, 2),
  bcag_award NUMERIC(8, 2),
  bgpd_award NUMERIC(8, 2),
  csfg_award NUMERIC(8, 2),
  csgt_award NUMERIC(8, 2),
  csgd_award NUMERIC(8, 2),
  csgp_award NUMERIC(8, 2),
  sbsd_award NUMERIC(8, 2),
  application_cancel_date DATE,
  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  extracted_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ## Comments
COMMENT ON TABLE sims.sfas_applications IS 'This record contain data related to an Student Application on SFAS.';

COMMENT ON COLUMN sims.sfas_applications.id IS 'The unique key/number used in SFAS to identify this application (application.application_idx).';

COMMENT ON COLUMN sims.sfas_applications.individual_id IS 'The unique key/number used in SFAS to identify this individual (individual.individual_idx).';

COMMENT ON COLUMN sims.sfas_applications.start_date IS 'Educational program start date (application_assessment.educ_period_start_dte).';

COMMENT ON COLUMN sims.sfas_applications.end_date IS 'Educational program start date (application_assessment.educ_period_start_dte).';

COMMENT ON COLUMN sims.sfas_applications.program_year_id IS 'Program year (application.program_yr_id).';

COMMENT ON COLUMN sims.sfas_applications.bsl_award IS 'Total BC Student Loan (award_disbursement.disbursement_amt).';

COMMENT ON COLUMN sims.sfas_applications.csl_award IS 'Total CSL Student Loan (award_disbursement.disbursement_amt).';

COMMENT ON COLUMN sims.sfas_applications.bcag_award IS 'Total BC Access Grant award_disbursement.disbursement_amt.';

COMMENT ON COLUMN sims.sfas_applications.bgpd_award IS 'Total British Columbia Permanent Disability Grant (award_disbursement.disbursement_amt).';

COMMENT ON COLUMN sims.sfas_applications.csfg_award IS 'Total Canada Student Grant for Students in Full Time Studies (award_disbursement.disbursement_amt).';

COMMENT ON COLUMN sims.sfas_applications.csgt_award IS 'Total Canada Student Top-Up Grant for Adult Learners (award_disbursement.disbursement_amt).';

COMMENT ON COLUMN sims.sfas_applications.csgd_award IS 'Total Canada Grant – Full-Time with Dependent (award_disbursement.disbursement_amt).';

COMMENT ON COLUMN sims.sfas_applications.csgp_award IS 'Total Canada Student Grant for Students with Permanent Disabilities (award_disbursement.disbursement_amt).';

COMMENT ON COLUMN sims.sfas_applications.sbsd_award IS 'Total Supplemental Bursary for Students with Disabilities (award_disbursement.disbursement_amt).';

COMMENT ON COLUMN sims.sfas_applications.application_cancel_date IS 'Date that this application was canceled (application.cancel_dte).';

-- Audit columns
COMMENT ON COLUMN sims.sfas_applications.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.sfas_applications.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.sfas_applications.extracted_at IS 'Date that the record was extracted from SFAS.';