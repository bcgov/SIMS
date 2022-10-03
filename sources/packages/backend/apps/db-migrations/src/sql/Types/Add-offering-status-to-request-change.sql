ALTER TYPE sims.offering_status
ADD
    VALUE 'Under review'
AFTER
    'Declined';

ALTER TYPE sims.offering_status
ADD
    VALUE 'Awaiting approval'
AFTER
    'Under review';