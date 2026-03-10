-- Remove configurations for the student current year income appeal form from the dynamic_form_configurations table.
DELETE FROM
    sims.dynamic_form_configurations
WHERE
    form_type = 'Student current year income';