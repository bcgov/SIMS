ALTER TABLE
    sims.sfas_applications RENAME COLUMN assessed_eligible_need TO assessed_costs_discretionary_expenses;

COMMENT ON COLUMN sims.sfas_applications.assessed_costs_discretionary_expenses IS 'Discretionary expenses (assessment_v2.SP_EXP_OTHER).';