-- Add Designation to note types.
ALTER TYPE sims.note_types
ADD
    VALUE 'Application'
AFTER
    'General';