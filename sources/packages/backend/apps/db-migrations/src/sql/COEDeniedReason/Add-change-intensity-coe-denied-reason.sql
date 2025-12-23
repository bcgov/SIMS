ALTER TABLE
  sims.coe_denied_reasons
ADD
  COLUMN offering_intensity sims.offering_intensity;

COMMENT ON COLUMN sims.coe_denied_reasons.offering_intensity IS 'Define if the message is specific to full-time or part-time. If null, the message is applicable for both intensities.';

INSERT INTO
  sims.coe_denied_reasons(id, reason, offering_intensity)
VALUES
  (
    7,
    'You are currently enrolled as a full-time student. Please cancel your part-time application and reapply using the full-time application process',
    'Part Time'
  ),
  (
    8,
    'You are currently enrolled as a part-time student. Please cancel your full-time application and reapply using the part-time application process',
    'Full Time'
  );