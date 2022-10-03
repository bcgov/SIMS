-- Rename the values of sims.offering_status from creation and change perspective.
ALTER TYPE sims.offering_status RENAME VALUE 'Pending' TO 'Creation pending';

ALTER TYPE sims.offering_status RENAME VALUE 'Declined' TO 'Creation declined';

ALTER TYPE sims.offering_status RENAME VALUE 'Under review' TO 'Change under review';

ALTER TYPE sims.offering_status RENAME VALUE 'Awaiting approval' TO 'Change awaiting approval';