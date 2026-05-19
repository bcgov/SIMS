DELETE FROM
    sims.system_lookup_configurations
WHERE
    lookup_category IN (
        'Disability type',
        'Disability impairments',
        'Disability designation'
    );