ALTER TABLE
    sims.sfas_individuals
ADD
    COLUMN part_time_msfaa_number CHAR(10),
ADD
    COLUMN part_time_effective_date DATE;

COMMENT ON COLUMN sims.sfas_individuals.part_time_msfaa_number IS 'The most recent Part-time Master Student Loan Agreement Number (agreement_num.sail_msfaa_numbers).';

COMMENT ON COLUMN sims.sfas_individuals.part_time_effective_date IS 'The most recent Part-time Master Student Loan Agreement effective date (effective_date.sail_msfaa_numbers).';