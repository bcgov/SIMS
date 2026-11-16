-- Update exceptional expense appeal description in dynamic form configurations.
UPDATE
  sims.dynamic_form_configurations
SET
  form_description = 'If you have incurred expenses outside of standard living costs that are unexpected and beyond your control, and that created financial hardship affecting your ability to start or continue your studies, these expenses may be considered as part of your assessment. Expenses incurred must be from the previous 12 months up to the date of your application submission.'
WHERE
  form_definition_name = 'studentexceptionalexpenseappeal';
