-- Rollback the case adjustments.
ALTER TYPE sims.program_info_status RENAME VALUE 'Required' TO 'required';

ALTER TYPE sims.program_info_status RENAME VALUE 'Not Required' TO 'not required';

ALTER TYPE sims.program_info_status RENAME VALUE 'Completed' TO 'completed';