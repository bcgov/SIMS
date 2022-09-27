-- Add Not Required to rollback.
ALTER TYPE sims.coe_status
ADD
    VALUE 'Not Required'
AFTER
    'Required';