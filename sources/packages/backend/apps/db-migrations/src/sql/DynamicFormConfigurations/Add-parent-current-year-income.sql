-- Insert configuration for the parent current year income appeal form into the dynamic_form_configurations table.
INSERT INTO
    sims.dynamic_form_configurations (
        form_type,
        form_definition_name,
        form_category,
        form_description,
        has_application_scope,
        allow_bundled_submission
    )
VALUES
    (
        'Parent current year income',
        'parentcurrentyearincomeappeal',
        'Student appeal',
        'If either of your parents has had, or is anticipated to have, a significant decrease in gross income, you may submit this appeal to request assessment using their current year estimated gross income.',
        TRUE,
        TRUE
    )