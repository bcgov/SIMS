ALTER TABLE
    sims.notification_messages
ADD
    COLUMN notify_template_id UUID;

COMMENT ON COLUMN sims.notification_messages.notify_template_id IS 'Template ID used to send the notification.';

-- Map the existing template_id values to the new notify_template_id values based on the provided mapping.
UPDATE
    sims.notification_messages AS notification_message
SET
    notify_template_id = template_mapping.notify_template_id
FROM
    (
        VALUES
            (
                -- Student File Upload (Ministry - Student File Upload with Filenames)
                '15646bc8-035c-46a5-8ca1-a46ef4e808b5' :: UUID,
                '52a34645-8bee-4482-b145-7c3067289887' :: UUID
            ),
            (
                -- Ministry File Upload (Student - Ministry File Upload)
                '0b1abf34-d607-4f5c-8669-71fd4a2e57fe' :: UUID,
                '4bb7a661-162f-4d28-8777-bfc28979c119' :: UUID
            ),
            (
                -- A restriction has placed on your account. Please visit your account activity page to view additional details.
                '2b64245f-770c-4493-9d3c-4e0f86773987' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Ministry completes updating exception for an application.
                '88cf59a0-7c0e-4162-8ee0-76a64821a012' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Ministry completes updating a change requested by student.
                'd78624da-c0f3-4bf7-8508-e311a50cfead' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Institution reporting a change on application.
                'ae5970e4-d8e6-41e5-ba52-a79773d8ff84' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Institution completes updating PIR.
                '6975ee6a-f988-4955-9153-127aa551a2a3' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Institution completes enrolment for an application.
                '8535a144-17bb-4d55-babb-875a70ebedb3' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Assessment ready for student confirmation.
                'bbe0341a-cfb5-4262-b817-6f4b70a0c2cf' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- SIN Validation complete.
                '9a607113-198e-4f8a-b28e-dad3f69cb46a' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- ECE response file processing details.
                'a662979f-07d4-44c0-a38f-ab9fda5671fe' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- MSFAA Cancellation
                'b3093a44-da3d-4ea5-af3a-1542535ae7e9' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Application Offering Change Request In Progress With Student
                '545fe311-7fea-428d-8522-56e12b641b1e' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Application Offering Change Request Completed By Ministry
                '24ea085b-c7b3-4ef4-8627-3d6bdd1e62cb' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Legacy Restriction Added
                '69d5f064-1efa-4109-a45a-5857a6acb612' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Disbursement withheld
                'bf53ce0d-c59c-4d03-badb-e0cab04ac582' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Disbursement withheld ministry notification
                'a0bf7cc1-b3f7-463a-a594-d9f10b704e80' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Ministry notification for student submits change request after COE.
                '241a360a-07d6-486f-9aa4-fae6903e1cff' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Ministry notification for student submits application with exception request.
                '997c6625-5571-4c92-94d1-7d7c1b86fd8c' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Ministry notification for student requests BasicBCeID account.
                'e9cf5143-c553-4937-9a5c-fab4230782aa' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Ministry notification for student application is edited for the 5th time.
                '952acba8-8806-4b9e-aee3-a14ea3823bbf' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Ministry notification for change to a students program or offering.
                'd76816c1-9b3c-4fe7-a22d-beb773cfdac5' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Ministry notification for institution adds pending program.
                '999e31e1-ea2d-4583-a17c-106906340266' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Ministry notification for institution adds pending offering.
                '9f0a0f79-05a6-4b81-9e71-6a85906601ef' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Ministry notification for institution requests designation.
                'a77868a8-c51f-4f79-b6a2-8f855960bb3d' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Ministry notification for partial student account matches.
                '2108329e-7939-46a0-a8f1-bae05f7ce2a2' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Ministry notification for eCert feedback file error.
                '9ab7adce-354e-4645-9679-6ce531954a23' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Ministry notification for provincial daily disbursement report.
                '730db0dc-967b-4adb-afa2-38235ad9f051' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Student notification for supporting user information required.
                '46f36b94-9c14-406d-a03c-bbec618726e4' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Student application notification for PD/PPD reminder email 8 weeks before end date.
                '7faea39f-cf8e-41ee-af02-c4790cac5b26' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Student application notification for second disbursement still pending.
                '55fcf228-b899-49a7-ab80-9b854c0bd884' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Student notification for parent declaration information required with parent able to report.
                '8832918f-c084-45c4-a360-55606fb24569' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Student notification for parent declaration information required with parent unable to report.
                '357ace3c-7a8a-4d49-b1de-f20c0dd5e84f' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Student notification for scholastic standing reversal.
                'bba2cb8a-7a45-4171-abc3-164ac5a0a714' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Student application notification for COE required near study end date.
                '4da67f87-ec53-4d9b-809c-4610e1c76362' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Ministry notification for student submits change request.
                'fad81016-0bed-4d4e-ad48-f70cc943399c' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Student notification for change request review completed.
                '9a4855d1-4f9a-4293-9868-cd853a8e4061' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Ministry notification for student form submission.
                '296aa2ea-dfa7-4285-9d5b-315b2a4911d6' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Student notification for form submission completed.
                'fed6b26e-d1f2-4a8c-bfe5-5cb66c00458b' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Ministry notification for file processing issue.
                'cb0efb5a-7540-4925-b017-e9d96852368f' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Student notification for accepting assessment overdue reminder.
                '8d9fef2b-037f-4e59-aefc-61f3105a6510' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Ministry notification for suspension restriction blocking application.
                '0f756338-670d-4fee-bba4-fd69f8210d17' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            ),
            (
                -- Student notification sent when the former youth in care question is answered with anything other than no.
                '636dd0c7-fe23-4a25-826b-03202326b580' :: UUID,
                '00000000-0000-0000-0000-000000000000' :: UUID
            )
    ) AS template_mapping(template_id, notify_template_id)
WHERE
    notification_message.template_id = template_mapping.template_id;

-- Populate the new notify_template_id column with data from the existing template_id column.
UPDATE
    sims.notification_messages
SET
    notify_template_id = template_id :: UUID
WHERE
    notify_template_id IS NULL;

-- Add NOT NULL constraint to the new notify_template_id column after populating it with data from template_id.
ALTER TABLE
    sims.notification_messages
ALTER COLUMN
    notify_template_id
SET
    NOT NULL;