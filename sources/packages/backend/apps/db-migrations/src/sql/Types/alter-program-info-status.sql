-- Adjust the case to be user-friendly starting with proper case as decided by the team.
ALTER TYPE sims.program_info_status RENAME VALUE 'required' TO 'Required';

ALTER TYPE sims.program_info_status RENAME VALUE 'not required' TO 'Not Required';

ALTER TYPE sims.program_info_status RENAME VALUE 'completed' TO 'Completed';

-- Add new enum options.
ALTER TYPE sims.program_info_status
ADD
  VALUE 'Submitted'
AFTER
  'Not Required';

ALTER TYPE sims.program_info_status
ADD
  VALUE 'Declined'
AFTER
  'Completed';