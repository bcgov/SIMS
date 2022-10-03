-- Create an enum for restriction action type.
CREATE TYPE sims.restriction_action_types AS ENUM (
  'No effect',
  'Stop full time BC funding',
  'Stop part time apply',
  'Stop full time apply',
  'Stop part time disbursement',
  'Stop full time disbursement'
);