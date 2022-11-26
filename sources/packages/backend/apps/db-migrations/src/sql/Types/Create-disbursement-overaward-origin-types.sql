CREATE TYPE sims.disbursement_overaward_origin_types AS ENUM (
    'Reassessment overaward',
    'Award value adjusted',
    'Pending award cancelled',
    'Manually entered',
    'Imported'
);