CREATE TABLE sims.ecert_feedback_errors(
    id SERIAL PRIMARY KEY,
    error_code VARCHAR(10) NOT NULL,
    error_description VARCHAR(250) NOT NULL,
    offering_intensity sims.offering_intensity NOT NULL,
    block_funding BOOLEAN NOT NULL,
    -- There are no audit columns for this field as it is not expected to be updated
    -- by an application user.
    CONSTRAINT error_code_offering_intensity_unique UNIQUE (error_code, offering_intensity)
);

-- ## Comments
COMMENT ON TABLE sims.ecert_feedback_errors IS 'Errors that can be received in the e-Cert feedback file.';

COMMENT ON COLUMN sims.ecert_feedback_errors.id IS 'Auto-generated sequential primary key column';

COMMENT ON COLUMN sims.ecert_feedback_errors.error_code IS 'Error code.';

COMMENT ON COLUMN sims.ecert_feedback_errors.error_description IS 'Error description.';

COMMENT ON COLUMN sims.ecert_feedback_errors.offering_intensity IS 'Offering intensity of the error. Errors are distinct to offering intensity.';

COMMENT ON COLUMN sims.ecert_feedback_errors.block_funding IS 'Indicates if the error will block the funding.';

COMMENT ON CONSTRAINT error_code_offering_intensity_unique ON sims.ecert_feedback_errors IS 'Ensure that error codes are unique within given offering intensity.';