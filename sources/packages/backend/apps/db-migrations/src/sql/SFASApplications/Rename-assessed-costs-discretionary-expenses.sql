ALTER TABLE
    sims.sfas_applications RENAME COLUMN assessed_costs_discretionary_expenses TO assessed_eligible_need;

COMMENT ON COLUMN sims.sfas_applications.assessed_eligible_need IS 'Assessed eligible need (Application_assessment.student_eligible_award).';