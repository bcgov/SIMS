-- Insert configurations for the student current year income appeal form into the dynamic_form_configurations table.
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
        'Student current year income',
        'studentcurrentyearincomeappeal',
        'Student appeal',
        'Submit this appeal to provide your current year income information if you have experienced a significant change in your financial circumstances since you submitted your Student Financial Aid Application.',
        TRUE,
        TRUE
    );