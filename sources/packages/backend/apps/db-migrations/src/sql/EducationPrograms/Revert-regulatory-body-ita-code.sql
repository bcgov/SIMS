/*
 Revert the regulatory body skilledTradesBC to ita.
 */
UPDATE
  sims.education_programs
SET
  regulatory_body = 'ita'
WHERE
  regulatory_body = 'skilledTradesBC';