-- Rename the values to previously existing ones.
-- Please make sure that source code is updated at the consumer side to match the modified values.
ALTER TYPE sims.offering_status RENAME VALUE 'Creation pending' TO 'Pending';

ALTER TYPE sims.offering_status RENAME VALUE 'Creation declined' TO 'Declined';

ALTER TYPE sims.offering_status RENAME VALUE 'Change under review' TO 'Under review';

ALTER TYPE sims.offering_status RENAME VALUE 'Change awaiting approval' TO 'Awaiting approval';