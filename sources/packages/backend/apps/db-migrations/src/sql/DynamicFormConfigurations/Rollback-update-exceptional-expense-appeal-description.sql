-- Roll back exceptional expense appeal description in dynamic form configurations.
UPDATE
  sims.dynamic_form_configurations
SET
  form_description = 'If you have had exceptional expenses that created financial hardship that affected your ability to start or continue your studies these expenses may be considered AS part of your assessment.'
WHERE
  form_definition_name = 'studentexceptionalexpenseappeal';
