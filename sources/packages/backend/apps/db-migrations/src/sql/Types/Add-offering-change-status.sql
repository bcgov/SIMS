ALTER TYPE sims.offering_status
ADD
    VALUE 'Change overwritten'
AFTER
    'Awaiting approval';

ALTER TYPE sims.offering_status
ADD
    VALUE 'Change declined'
AFTER
    'Change overwritten';