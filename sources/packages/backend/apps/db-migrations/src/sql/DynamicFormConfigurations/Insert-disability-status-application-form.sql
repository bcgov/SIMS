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
        'Disability status application',
        'disabilitystatusapplicationform',
        'Student form',
        'This form allows you to declare a Permanent Disability (PD) or Persistent and Prolonged Disability (PPD) status. Approval of this form will update your profile with disability status and allow for disability-related funding within the StudentAid BC application.',
        FALSE,
        FALSE,
        'disability-status-application'
    );