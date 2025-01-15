UPDATE
    sims.sfas_individuals
SET
    csl_overaward = bcsl_overaward,
    bcsl_overaward = csl_overaward;

COMMENT ON COLUMN sims.sfas_individuals.csl_overaward IS 'Canada Student Loan total overaward balance (overaward_balance.overaward_balance_amt, overaward_balance_cde = "CSL").';

COMMENT ON COLUMN sims.sfas_individuals.bcsl_overaward IS 'BC Student Loan total overaward balance (overaward_balance.overaward_balance_amt, overaward_balance_cde = "BCSL").';