/*
 Update the regulatory body ita to skilledTradesBC in education programs relation.
 */
UPDATE
  sims.education_programs
SET
  regulatory_body = 'skilledTradesBC'
WHERE
  regulatory_body = 'ita';