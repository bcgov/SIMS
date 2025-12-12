DELETE FROM
    sims.queue_configurations
WHERE
    queue_name IN ('t4a-upload-enqueuer', 't4a-upload');