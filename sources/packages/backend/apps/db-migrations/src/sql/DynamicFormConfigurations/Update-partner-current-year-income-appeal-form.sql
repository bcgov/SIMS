-- Update partner current year income appeal display name in dynamic form configurations.
UPDATE
  sims.dynamic_form_configurations
SET
  form_type = 'Spouse/common-law partner current year income'
WHERE
  form_definition_name = 'partnercurrentyearincomeappeal';