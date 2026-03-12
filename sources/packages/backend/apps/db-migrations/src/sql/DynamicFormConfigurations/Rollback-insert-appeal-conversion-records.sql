-- Remove configurations for the student current year income, partner current year income and exceptional expense appeal forms from the dynamic_form_configurations table.
DELETE FROM
    sims.dynamic_form_configurations
WHERE
    form_type IN (
        'Student current year income',
        'Partner current year income',
        'Exceptional expense'
    );