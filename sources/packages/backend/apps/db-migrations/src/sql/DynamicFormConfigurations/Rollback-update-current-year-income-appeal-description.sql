-- Roll back the descriptions of the student, parent and spouse/common-law partner current year income appeal forms in dynamic form configurations.
UPDATE
  sims.dynamic_form_configurations
SET
  form_description = 'Submit this appeal to provide your current year income information if you have experienced a significant change in your financial circumstances since you submitted your Student Financial Aid Application.'
WHERE
  form_definition_name = 'studentcurrentyearincomeappeal';

UPDATE
  sims.dynamic_form_configurations
SET
  form_description = 'If either of your parents has had, or is anticipated to have, a significant decrease in gross income, you may submit this appeal to request assessment using their current year estimated gross income.'
WHERE
  form_definition_name = 'parentcurrentyearincomeappeal';

UPDATE
  sims.dynamic_form_configurations
SET
  form_description = 'If your spouse/common-law partner has had, or is anticipated to have, a significant decrease in gross income, you may submit this appeal to request assessment using their current year estimated gross income.'
WHERE
  form_definition_name = 'partnercurrentyearincomeappeal';
