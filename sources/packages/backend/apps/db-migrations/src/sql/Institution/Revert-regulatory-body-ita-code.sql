/*
 Revert the regulatory body skilledTradesBC to ita in institution relation.
 */
UPDATE
  sims.institutions
SET
  regulating_body = 'ita'
WHERE
  regulating_body = 'skilledTradesBC';