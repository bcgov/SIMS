/*
 Revert the regulatory body skilledTradesBC to ita in education programs relation.
 */
UPDATE
  sims.education_programs
SET
  regulatory_body = 'ita'
WHERE
  regulatory_body = 'skilledTradesBC';