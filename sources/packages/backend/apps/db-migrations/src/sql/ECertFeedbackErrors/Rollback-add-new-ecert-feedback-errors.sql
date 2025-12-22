DELETE FROM
    sims.ecert_feedback_errors
WHERE
    (error_code, offering_intensity) IN (
        ('EDU-00077', 'Full Time'),
        ('LNS-00716', 'Part Time'),
        ('LNS-BR035', 'Part Time'),
        ('LNS-00684', 'Full Time'),
        ('LNS-00684', 'Part Time')
    );