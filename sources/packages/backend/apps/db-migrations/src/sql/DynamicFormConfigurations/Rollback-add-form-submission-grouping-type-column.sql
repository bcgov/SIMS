ALTER TABLE
    sims.dynamic_form_configurations DROP COLUMN form_category,
    DROP COLUMN form_submission_grouping_type;

DELETE FROM
    sims.dynamic_form_configurations
WHERE
    form_definition_name IN (
        'roomandboardcostsappeal',
        'stepparentwaiverappeal',
        'modifiedindependentappeal',
        'nonpunitivewithdrawalform'
    );