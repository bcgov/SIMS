UPDATE
  sims.ecert_feedback_errors
SET
  block_funding = FALSE
WHERE
  offering_intensity = 'Full Time'
  AND error_code IN (
    'EDU-00040',
    'EDU-00041',
    'EDU-00042',
    'EDU-00043',
    'EDU-00044',
    'EDU-00045',
    'EDU-00046',
    'EDU-00047',
    'EDU-00048',
    'EDU-00049',
    'EDU-00050',
    'EDU-00051',
    'EDU-00052',
    'EDU-00070',
    'EDU-00074',
    'EDU-00095',
    'EDU-00096',
    'EDU-00097',
    'EDU-00098',
    'EDU-00099',
    'EDU-00100',
    'EDU-00101',
    'EDU-00102',
    'EDU-00111'
  );