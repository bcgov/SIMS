-- Create an enum for restriction action type.
CREATE TYPE sims.restriction_action_type AS ENUM (
  'No effect',
  'Stop BC funding',
  'Stop apply',
  'Stop disbursement'
);