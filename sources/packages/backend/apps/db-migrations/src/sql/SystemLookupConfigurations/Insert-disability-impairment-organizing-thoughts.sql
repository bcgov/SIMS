INSERT INTO
    sims.system_lookup_configurations(
        lookup_category,
        lookup_key,
        lookup_value,
        lookup_priority,
        creator
    )
VALUES
    (
        'Disability impairment',
        'ORGANIZING_THOUGHTS',
        'Organizing thoughts',
        1,
        (
            SELECT
                id
            FROM
                sims.users
            WHERE
                -- System user.
                user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system'
        )
    );