CREATE TABLE IF NOT EXISTS sims.sfas_individuals (
  id INT PRIMARY KEY,
  first_name VARCHAR(50),
  last_name VARCHAR(50) NOT NULL,
  birth_date DATE NOT NULL,
  sin CHAR(9) NOT NULL,
  pd_status BOOLEAN,
  msfaa_number CHAR(10),
  msfaa_signed_date DATE,
  neb NUMERIC(10) NOT NULL,
  bcgg NUMERIC(10) NOT NULL,
  lfp NUMERIC(8, 2) NOT NULL,
  pal NUMERIC(8, 2) NOT NULL,
  csl_overaward NUMERIC(8, 2) NOT NULL,
  bcsl_overaward NUMERIC(8, 2) NOT NULL,
  cms_overaward NUMERIC(8, 2) NOT NULL,
  grant_overaward NUMERIC(8, 2) NOT NULL,
  withdrawals INT NOT NULL,
  unsuccessful_completion INT NOT NULL,
  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  extracted_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX sfas_individuals_lower_last_name_birth_date_sin ON sims.sfas_individuals(lower(last_name), birth_date, sin);

-- ## Comments
COMMENT ON TABLE sims.sfas_individuals IS 'These records contain data related to an individual/student in SFAS.';

COMMENT ON COLUMN sims.sfas_individuals.id IS 'Unique identifier from SFAS.';

COMMENT ON COLUMN sims.sfas_individuals.first_name IS 'The first name as defined in SFAS(individual_alias.first_name).';

COMMENT ON COLUMN sims.sfas_individuals.last_name IS 'The last name as defined in SFAS (individual_alias.last_name).';

COMMENT ON COLUMN sims.sfas_individuals.birth_date IS 'Date of birth (individual.date_of_birth).';

COMMENT ON COLUMN sims.sfas_individuals.sin IS 'Social Insurance Number for the student (individual.sin).';

COMMENT ON COLUMN sims.sfas_individuals.pd_status IS 'Permanent Disability Flag (individual.permanent_disability_flg).';

COMMENT ON COLUMN sims.sfas_individuals.msfaa_number IS 'The most recent, active Master Student Loan Agreement Number (loan_agreement_request.msfaa_agreement_number).';

COMMENT ON COLUMN sims.sfas_individuals.msfaa_signed_date IS 'The most recent, active Master Student Loan Agreement signed date (loan_agreement_request.loan_agreement_signed_dte).';

COMMENT ON COLUMN sims.sfas_individuals.neb IS 'Total Nurses Education Bursary (special_program_award.program_awd_cents, award_cde = "SP04").';

COMMENT ON COLUMN sims.sfas_individuals.bcgg IS 'BC Completion Grant for Graduates (individual_award.award_dlr, award_cde = "BCGG").';

COMMENT ON COLUMN sims.sfas_individuals.lfp IS 'Nurses/Medical Loan Forgiveness.';

COMMENT ON COLUMN sims.sfas_individuals.pal IS 'Pacific Leaders Loan Forgiveness.';

COMMENT ON COLUMN sims.sfas_individuals.csl_overaward IS 'Canada Student Loan total overaward balance (overaward_balance.overaward_balance_amt, overaward_balance_cde = "BCSL").';

COMMENT ON COLUMN sims.sfas_individuals.bcsl_overaward IS 'BC Student Loan total overaward balance (overaward_balance.overaward_balance_amt, overaward_balance_cde = "CSL").';

COMMENT ON COLUMN sims.sfas_individuals.cms_overaward IS 'Canada Millennium Grant total overaward balance (overaward_balance.overaward_balance_amt, overaward_balance_cde = "GRNT").';

COMMENT ON COLUMN sims.sfas_individuals.grant_overaward IS 'BC Grant total overaward balance (overaward_balance.overaward_balance_amt, overaward_balance_cde = "EGRT").';

COMMENT ON COLUMN sims.sfas_individuals.withdrawals IS 'Total number of non-punitive withdrawals (either in funded or non-funded periods). BCSLWTHD count.';

COMMENT ON COLUMN sims.sfas_individuals.unsuccessful_completion IS 'Total of unsuccessful completion weeks (unsuccessful_completion.uc_weeks_qty).';

-- Audit columns
COMMENT ON COLUMN sims.sfas_individuals.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.sfas_individuals.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.sfas_individuals.extracted_at IS 'Date that the record was extracted from SFAS.';