DELETE FROM
    sims.system_lookup_configurations
WHERE
    lookup_category IN (
        'Program length',
        'Institution regulatory body',
        'Program entrance requirement',
        'Program aviation credential'
    );