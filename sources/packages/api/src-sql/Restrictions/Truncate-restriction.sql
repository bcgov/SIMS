-- * This script is used by 'up' of CleanRestrictionsTable1652466821171 and 'down' of InsertRestrictions1652480204380 files.
-- Clean restrictions table.
-- Clean the tables that has relation with restrictions table.
-- Clean federal_restrictions.
DELETE FROM
  sims.federal_restrictions;

-- Clean institution_restrictions.
DELETE FROM
  sims.institution_restrictions;

-- Clean student_restrictions.
DELETE FROM
  sims.student_restrictions;

--Clean restrictions.
DELETE FROM
  sims.restrictions;