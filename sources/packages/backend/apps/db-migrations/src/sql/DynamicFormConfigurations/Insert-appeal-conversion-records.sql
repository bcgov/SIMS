-- Insert configurations for the student current year income, partner current year income, and exceptional expense appeal forms into the dynamic_form_configurations table.
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
    ),
    (
        'Partner current year income',
        'partnercurrentyearincomeappeal',
        'Student appeal',
        'Submit this appeal to provide your spouse/common-law partner'' s current year income information IF they have experienced a significant CHANGE IN their financial circumstances since you submitted your Student Financial Aid Application.',
        TRUE,
        TRUE
    ),
    (
        'Exceptional expense',
        'studentexceptionalexpenseappeal',
        'Student appeal',
        'If you have had exceptional expenses that created financial hardship that affected your ability to start or continue your studies these expenses may be considered AS part of your assessment.',
        TRUE,
        TRUE
    );