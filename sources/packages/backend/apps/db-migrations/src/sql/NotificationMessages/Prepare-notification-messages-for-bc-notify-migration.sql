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
                -- Student File Upload (Ministry - Student File Upload with Filenames).
                '15646bc8-035c-46a5-8ca1-a46ef4e808b5' :: UUID,
                '52a34645-8bee-4482-b145-7c3067289887' :: UUID
            ),
            (
                -- Ministry File Upload (Student - Ministry File Upload).
                '0b1abf34-d607-4f5c-8669-71fd4a2e57fe' :: UUID,
                '4bb7a661-162f-4d28-8777-bfc28979c119' :: UUID
            ),
            (
                -- A restriction has placed on your account. Please visit your account activity page to view additional details (Student - Restriction Added).
                '2b64245f-770c-4493-9d3c-4e0f86773987' :: UUID,
                '21af88bf-74ca-4805-bf2c-c6134d911ef3' :: UUID
            ),
            (
                -- Ministry completes updating exception for an application (Student - Ministry Completes Exception).
                '88cf59a0-7c0e-4162-8ee0-76a64821a012' :: UUID,
                'fc0204d7-2432-4e31-9430-403f61207df7' :: UUID
            ),
            (
                -- Ministry completes updating a change requested by student (Student - Ministry Completes Requested Change).
                'd78624da-c0f3-4bf7-8508-e311a50cfead' :: UUID,
                '99d5e448-aee1-4ec8-b351-f6c5b93272de' :: UUID
            ),
            (
                -- Institution reporting a change on application (Student - Institution Reports A Change).
                'ae5970e4-d8e6-41e5-ba52-a79773d8ff84' :: UUID,
                '634eb22e-7a61-447c-a8bb-b51ef849af62' :: UUID
            ),
            (
                -- Institution completes updating PIR (Student - Institution Completes PIR).
                '6975ee6a-f988-4955-9153-127aa551a2a3' :: UUID,
                'e42e97ce-5dcc-40ac-9bc7-fbf8951c0e2a' :: UUID
            ),
            (
                -- Institution completes enrolment for an application (Student - Institution Completes Enrolment).
                '8535a144-17bb-4d55-babb-875a70ebedb3' :: UUID,
                'd7a93846-fd26-46ef-80ba-f0c89b7a3fae' :: UUID
            ),
            (
                -- Assessment ready for student confirmation (Student - Assessment Ready).
                'bbe0341a-cfb5-4262-b817-6f4b70a0c2cf' :: UUID,
                '0b1b6922-e346-479d-9995-cc9f1ce19eca' :: UUID
            ),
            (
                -- SIN Validation complete (Student - SIN Validation Complete).
                '9a607113-198e-4f8a-b28e-dad3f69cb46a' :: UUID,
                '5791b55e-001e-40ac-8d32-9391de8fbcdd' :: UUID
            ),
            (
                -- ECE response file processing details (Student - ECE Response File Processing Details).
                'a662979f-07d4-44c0-a38f-ab9fda5671fe' :: UUID,
                '11990ef0-dcfc-407c-8a1f-ebca135bdfe7' :: UUID
            ),
            (
                -- MSFAA Cancellation (Student - MSFAA Cancellation)
                'b3093a44-da3d-4ea5-af3a-1542535ae7e9' :: UUID,
                '9d08fc5d-65c8-4be7-960b-a72b21298b71' :: UUID
            ),
            (
                -- Application Offering Change Request In Progress With Student (Student - Institution Requests a Change).
                '545fe311-7fea-428d-8522-56e12b641b1e' :: UUID,
                'd85e95f8-6330-4e5d-bfa3-400b853bb8f2' :: UUID
            ),
            (
                -- Application Offering Change Request Completed By Ministry (Student - Ministry Completes Application Offering Change Request).
                '24ea085b-c7b3-4ef4-8627-3d6bdd1e62cb' :: UUID,
                'd0e37940-d00f-43ad-9f02-214db1ac7745' :: UUID
            ),
            (
                -- Legacy Restriction Added (Ministry - Legacy Restriction Added).
                '69d5f064-1efa-4109-a45a-5857a6acb612' :: UUID,
                '3f2e8f9a-7627-433d-be17-c72041ef7c14' :: UUID
            ),
            (
                -- Disbursement withheld (Student - Disbursements Blocked by Federal/eCert).
                'bf53ce0d-c59c-4d03-badb-e0cab04ac582' :: UUID,
                '27093927-1c08-4ab7-a5f6-afd6b9929cb9' :: UUID
            ),
            (
                -- Disbursement withheld ministry notification (Ministry - Disbursements Blocked by Federal/eCert).
                'a0bf7cc1-b3f7-463a-a594-d9f10b704e80' :: UUID,
                '0e2f82e8-1d24-4a7d-9672-6bd74cddb1b4' :: UUID
            ),
            (
                -- Ministry notification for student submits change request after COE (Ministry - Student Submits Appeal / Old Change Request).
                '241a360a-07d6-486f-9aa4-fae6903e1cff' :: UUID,
                'becf1ee6-25f1-4524-9a55-2ad028232544' :: UUID
            ),
            (
                -- Ministry notification for student submits application with exception request (Ministry - Student Submits Application with Exception Request).
                '997c6625-5571-4c92-94d1-7d7c1b86fd8c' :: UUID,
                '5759a275-5d4f-4d4f-b829-5f3483cf2289' :: UUID
            ),
            (
                -- Ministry notification for student requests BasicBCeID account (Ministry - Student Requests BasicBCeID account).
                'e9cf5143-c553-4937-9a5c-fab4230782aa' :: UUID,
                '43b14816-c974-4aa8-9cdb-1f082067798f' :: UUID
            ),
            (
                -- Ministry notification for student application is edited for the 5th time (Ministry - Student application is edited for 5th time).
                '952acba8-8806-4b9e-aee3-a14ea3823bbf' :: UUID,
                'f651240f-a63a-436e-9492-226d1cfd3a1f' :: UUID
            ),
            (
                -- Ministry notification for change to a students program or offering (Ministry - Change to a Student's Program or Offering).
                'd76816c1-9b3c-4fe7-a22d-beb773cfdac5' :: UUID,
                '4419ebf7-ac41-4b0d-ab3c-afe5479b3ae6' :: UUID
            ),
            (
                -- Ministry notification for institution adds pending program (Ministry - Institution adds pending program (copy)).
                '999e31e1-ea2d-4583-a17c-106906340266' :: UUID,
                'eeba056e-fc71-4a0a-afb7-fa06aac1ec52' :: UUID
            ),
            (
                -- Ministry notification for institution adds pending offering (Ministry - Institution adds pending offering (copy)).
                '9f0a0f79-05a6-4b81-9e71-6a85906601ef' :: UUID,
                'f42d9896-22ad-40bc-ad6e-6982bd492e93' :: UUID
            ),
            (
                -- Ministry notification for institution requests designation (Ministry - Institution requests designation).
                'a77868a8-c51f-4f79-b6a2-8f855960bb3d' :: UUID,
                '9abd7885-bf6f-4f59-981f-a73e341a1f6a' :: UUID
            ),
            (
                -- Ministry notification for partial student account matches (Ministry - Partial Student Profile Match).
                '2108329e-7939-46a0-a8f1-bae05f7ce2a2' :: UUID,
                'c1518247-a040-4c8d-9efc-72ee64d2dcf7' :: UUID
            ),
            (
                -- Ministry notification for eCert feedback file error (Ministry - eCert Feedback File Error (5744)).
                '9ab7adce-354e-4645-9679-6ce531954a23' :: UUID,
                'd12c9beb-6e06-4f82-abe5-36ceda7504a0' :: UUID
            ),
            (
                -- Ministry notification for provincial daily disbursement report (Ministry - SIMS Daily Disbursement File).
                '730db0dc-967b-4adb-afa2-38235ad9f051' :: UUID,
                'a9b1c6ae-f397-4e78-9bd4-493d2f89a513' :: UUID
            ),
            (
                -- Student notification for supporting user information required (Student - Supporting User Information Required (Legacy Partner)).
                '46f36b94-9c14-406d-a03c-bbec618726e4' :: UUID,
                'fd3ddc39-c9f3-4900-a810-3c0263597bf7' :: UUID
            ),
            (
                -- Student application notification for PD/PPD reminder email 8 weeks before end date (Student - Action required (Disability)).
                '7faea39f-cf8e-41ee-af02-c4790cac5b26' :: UUID,
                '360cdd14-3c97-4eac-ba74-cef35b057abc' :: UUID
            ),
            (
                -- Student application notification for second disbursement still pending (Student - Pending COE).
                '55fcf228-b899-49a7-ab80-9b854c0bd884' :: UUID,
                '3089e5fa-737f-4c50-94c4-8a971881a0fd' :: UUID
            ),
            (
                -- Student notification for parent declaration information required with parent able to report (Student - Parent Declaration Information Required (Parent Can Report)).
                '8832918f-c084-45c4-a360-55606fb24569' :: UUID,
                '1ef6ab46-8323-441d-81a2-da6cf8fc49db' :: UUID
            ),
            (
                -- Student notification for parent declaration information required with parent unable to report (Student - Parent Information Required (Parent Cannot Report)).
                '357ace3c-7a8a-4d49-b1de-f20c0dd5e84f' :: UUID,
                'f1c9916a-b36f-4f40-8ce1-3610cf620f56' :: UUID
            ),
            (
                -- Student notification for scholastic standing reversal (Student - Ministry Reverses Scholastic Standing).
                'bba2cb8a-7a45-4171-abc3-164ac5a0a714' :: UUID,
                '5ee2934e-7d81-4449-82c0-eb4eec8f08b1' :: UUID
            ),
            (
                -- Student application notification for COE required near study end date (Student - End date approaching).
                '4da67f87-ec53-4d9b-809c-4610e1c76362' :: UUID,
                'e46eebb9-5a48-4385-9212-3400656626e7' :: UUID
            ),
            (
                -- Ministry notification for student submits change request (Ministry - Student Submits Change Request (5849)).
                'fad81016-0bed-4d4e-ad48-f70cc943399c' :: UUID,
                '34855186-715a-4046-a550-c7dfa5e26332' :: UUID
            ),
            (
                -- Student notification for change request review completed (Student - Ministry Completes Change Request (5849)).
                '9a4855d1-4f9a-4293-9868-cd853a8e4061' :: UUID,
                '6aade73f-1991-4473-8e6d-e01fc9df00b2' :: UUID
            ),
            (
                -- Ministry notification for student form submission (Ministry - Student Submits Form/Appeal(5849)).
                '296aa2ea-dfa7-4285-9d5b-315b2a4911d6' :: UUID,
                '4679a627-7c55-4a20-bd30-4dbd1b0992b7' :: UUID
            ),
            (
                -- Student notification for form submission completed (Student - Ministry Completes  Form or Appeal (5849)).
                'fed6b26e-d1f2-4a8c-bfe5-5cb66c00458b' :: UUID,
                '5fbe0f20-2af7-4513-966a-1802c011b3ed' :: UUID
            ),
            (
                -- Ministry notification for file processing issue (Ministry - System Warning).
                'cb0efb5a-7540-4925-b017-e9d96852368f' :: UUID,
                'a82c0d03-50fb-4c45-afa8-f6217ff7e972' :: UUID
            ),
            (
                -- Student notification for accepting assessment overdue reminder (Student - Assessment Waiting to be Accepted (5796)).
                '8d9fef2b-037f-4e59-aefc-61f3105a6510' :: UUID,
                '3fb4ad38-3b90-49ee-92eb-0780315ceaba' :: UUID
            ),
            (
                -- Ministry notification for suspension restriction blocking application (Ministry - suspension restriction blocks application (6230)).
                '0f756338-670d-4fee-bba4-fd69f8210d17' :: UUID,
                'b9b0023d-68cb-4623-81d3-7064682d5d5e' :: UUID
            ),
            (
                -- Student notification sent when the former youth in care question is answered with anything other than no (Student - Former youth in care Info (TWP) (2911)).
                '636dd0c7-fe23-4a25-826b-03202326b580' :: UUID,
                '306b1c3d-624d-4969-9a2c-a4894035c1e7' :: UUID
            )
    ) AS template_mapping(template_id, notify_template_id)
WHERE
    notification_message.template_id = template_mapping.template_id;

-- Add NOT NULL constraint to the new notify_template_id column after populating it with data from template_id.
ALTER TABLE
    sims.notification_messages
ALTER COLUMN
    notify_template_id
SET
    NOT NULL;