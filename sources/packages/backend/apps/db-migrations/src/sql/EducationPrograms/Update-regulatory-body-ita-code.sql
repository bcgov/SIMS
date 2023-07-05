/*
 Update the regulatory body ita to skilledTradesBC in education programs relation.
 */
UPDATE
  sims.education_programs
SET
  regulatory_body = 'skilledTradesBC'
WHERE
  regulatory_body = 'ita';

/*
 Update the regulating body ita to skilledTradesBC in institutions relation.
 */
UPDATE
  sims.institutions
SET
  regulating_body = 'skilledTradesBC'
WHERE
  regulating_body = 'ita';