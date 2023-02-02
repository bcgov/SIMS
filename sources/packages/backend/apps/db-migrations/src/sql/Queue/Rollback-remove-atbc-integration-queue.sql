INSERT INTO
    queue_configurations(queue_name, queue_configuration)
VALUES
    (
        'atbc-integration',
        '{
            "retry": 3,
            "retryInterval": 180000,
            "dashboardReadonly": false
        }' :: json
    );