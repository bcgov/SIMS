ALTER TABLE
    sims.sfas_applications RENAME COLUMN assessed_costs_discretionary_expenses TO eligible_need;

COMMENT ON COLUMN sims.sfas_applications.eligible_need IS 'Eligible need.';