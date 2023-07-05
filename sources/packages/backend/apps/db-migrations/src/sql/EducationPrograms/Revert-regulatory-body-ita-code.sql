/*
 Revert the regulatory body skilledTradesBC to ita in education programs relation.
 */
UPDATE
  sims.education_programs
SET
  regulatory_body = 'ita'
WHERE
  regulatory_body = 'skilledTradesBC';

/*
 Revert the regulatory body skilledTradesBC to ita in institutions relation.
 */
UPDATE
  sims.institutions
SET
  regulating_body = 'ita'
WHERE
  regulating_body = 'skilledTradesBC';