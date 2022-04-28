-- Add Scholastic Standing to sims.offering_types.
ALTER TYPE sims.offering_types
ADD
    VALUE 'Scholastic standing'
AFTER
    'Private';