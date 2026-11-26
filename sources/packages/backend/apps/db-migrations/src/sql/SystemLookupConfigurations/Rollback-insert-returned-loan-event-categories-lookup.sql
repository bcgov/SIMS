DELETE FROM sims.system_lookup_configurations
WHERE
    lookup_category IN (
        'Returned loan reasons',
        'Returned loan customer gender'
    );