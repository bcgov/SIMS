-- Add Overaward to note types.
ALTER TYPE sims.note_types
ADD
    VALUE 'Overaward'
AFTER
    'Designation';