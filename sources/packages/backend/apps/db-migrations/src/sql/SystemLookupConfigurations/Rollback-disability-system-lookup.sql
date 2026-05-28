DELETE FROM
    sims.system_lookup_configurations
WHERE
    lookup_category IN (
        'Disability category',
        'Disability type',
        'Disability impairment'
    );