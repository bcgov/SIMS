/*
 Update the regulating body ita to skilledTradesBC in institution relation.
 */
UPDATE
  sims.institutions
SET
  regulating_body = 'skilledTradesBC'
WHERE
  regulating_body = 'ita';