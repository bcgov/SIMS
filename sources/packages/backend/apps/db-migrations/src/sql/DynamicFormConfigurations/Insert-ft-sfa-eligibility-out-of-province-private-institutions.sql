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
    'Canadian out-of-province private institution BC student financial aid train-out provision',
    'ftsfaeligibilityoutofprovinceprivateinstitutionsappeal',
    'Student appeal',
    'A request to be eligible to receive provincial student financial aid for an application at a private institution in Canada outside of British Columbia.',
    TRUE,
    TRUE,
    'sfa-eligibility-oop-private-institutions'
  );