ALTER TABLE
    sims.sfas_individuals
ADD
    COLUMN ppd_status BOOLEAN;

COMMENT ON COLUMN sims.sfas_individuals.ppd_status IS 'Persistent or Prolonged Disability Flag (individual.ppd_flg).';

ALTER TABLE
    sims.sfas_individuals
ADD
    COLUMN ppd_status_date DATE;

COMMENT ON COLUMN sims.sfas_individuals.ppd_status_date IS 'The date when a PPD status is effective (individual.ppd_status_dte).';