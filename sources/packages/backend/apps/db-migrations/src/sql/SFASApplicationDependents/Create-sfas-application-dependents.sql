CREATE TABLE sims.sfas_application_dependents (
    id INT PRIMARY KEY,
    application_id INT NOT NULL,
    dependent_name VARCHAR(25),
    dependent_birth_date DATE,
    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    extracted_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX sfas_application_dependents_application_id ON sims.sfas_application_dependents(application_id);

-- ## Comments
COMMENT ON TABLE sims.sfas_application_dependents IS 'Data related to student dependents (children) listed on each application in SFAS.';

COMMENT ON COLUMN sims.sfas_application_dependents.id IS 'The unique key/number assigned to each dependent record (applicant_dependent.applicant_dependent_idx).';

COMMENT ON COLUMN sims.sfas_application_dependents.application_id IS 'The unique key/number used in SFAS to identify this application (application.application_idx).';

COMMENT ON COLUMN sims.sfas_application_dependents.dependent_name IS 'First and last name of the child (may include other names as well) (applicant_dependent.dep_last_name).';

COMMENT ON COLUMN sims.sfas_application_dependents.dependent_birth_date IS 'Date of birth of the dependent (applicant_dependent.dep_date_of_birth).';

COMMENT ON COLUMN sims.sfas_application_dependents.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.sfas_application_dependents.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.sfas_application_dependents.extracted_at IS 'Date that the record was extracted from SFAS.';

COMMENT ON INDEX sims.sfas_application_dependents_application_id IS 'Index created on application_id to improve the performance of data retrieval.';