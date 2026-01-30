ALTER TABLE
    sims.dynamic_form_configurations DROP COLUMN form_category,
    DROP COLUMN form_description,
    DROP COLUMN has_application_scope,
    DROP COLUMN allow_bundled_submission;

DELETE FROM
    sims.dynamic_form_configurations
WHERE
    form_definition_name IN (
        'roomandboardcostsappeal',
        'stepparentwaiverappeal',
        'modifiedindependentappeal',
        'nonpunitivewithdrawalform'
    );