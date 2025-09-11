-- Remove the legacy B2D restriction map that is incorrectly mapped to B2 in SIMS.
DELETE FROM
    sims.sfas_restriction_maps
WHERE
    legacy_code = 'B2D'