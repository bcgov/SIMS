-- Add Submitted to enum option.
ALTER TYPE sims.coe_status
ADD
  VALUE 'Submitted'
AFTER
  'Not Required';