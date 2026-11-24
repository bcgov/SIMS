INSERT INTO
    sims.dynamic_form_configurations (
        form_type,
        form_definition_name,
        form_category,
        form_description,
        has_application_scope,
        allow_bundled_submission,
        authorization_key
    )
VALUES
    (
        'BC Loan Forgiveness Application',
        'bcloanforgivenessapplication',
        'Student form',
        'This form allows you to apply for the BC Loan Forgiveness Program. Before submitting an application, please ensure you have read the below instructions thoroughly.',
        FALSE,
        FALSE,
        'bc-loan-forgiveness-application'
    );
