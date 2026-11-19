-- Update the descriptions of the student, parent and spouse/common-law partner current year income appeal forms in dynamic form configurations.
UPDATE
  sims.dynamic_form_configurations
SET
  form_description = 'If you have had or anticipate having a significant decrease in gross income due to an exceptional circumstance (unexpected and beyond your control), you can submit this appeal to be assessed using this year''s estimated gross income.'
WHERE
  form_definition_name = 'studentcurrentyearincomeappeal';

UPDATE
  sims.dynamic_form_configurations
SET
  form_description = 'If either of your parents has had or anticipates having a significant decrease in gross income due to an exceptional circumstance (unexpected and beyond their control), you can submit this appeal to be assessed using this year''s estimated gross income.'
WHERE
  form_definition_name = 'parentcurrentyearincomeappeal';

UPDATE
  sims.dynamic_form_configurations
SET
  form_description = 'If your spouse/common-law partner has had or anticipates having a significant decrease in gross income due to an exceptional circumstance (unexpected and beyond their control), you can submit this appeal to be assessed using this year''s estimated gross income.'
WHERE
  form_definition_name = 'partnercurrentyearincomeappeal';
