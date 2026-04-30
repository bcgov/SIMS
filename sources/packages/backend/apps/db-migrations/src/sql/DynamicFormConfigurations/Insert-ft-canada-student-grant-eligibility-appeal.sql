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
        'Canada student grant for full-time students – restriction exemption provision',
        'ftcanadastudentgranteligibilityappeal',
        'Student appeal',
        'A request for consideration to receive the Canada Student Grant for Full-time Students under the exemption provision.',
        TRUE,
        TRUE,
        'csgf-eligibility-appeal'
    );