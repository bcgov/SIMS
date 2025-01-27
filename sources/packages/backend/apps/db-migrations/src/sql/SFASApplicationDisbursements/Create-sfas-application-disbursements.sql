CREATE TABLE sims.sfas_application_disbursements (
    id INT PRIMARY KEY,
    application_id INT NOT NULL,
    funding_type VARCHAR(4),
    funding_amount NUMERIC(8, 2),
    funding_date DATE,
    date_issued DATE,
    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    extracted_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX sfas_application_disbursements_application_id ON sims.sfas_application_disbursements(application_id);

-- ## Comments
COMMENT ON TABLE sims.sfas_application_disbursements IS 'These records contain data related to the actual funding disbursements records in SFAS.';

COMMENT ON COLUMN sims.sfas_application_disbursements.id IS 'The unique key/number used in SFAS to identify specific disbursement records (Award_disbursement.award_disbursement_idx).';

COMMENT ON COLUMN sims.sfas_application_disbursements.application_id IS 'The unique key/number used in SFAS to identify this application (Application.application_idx).';

COMMENT ON COLUMN sims.sfas_application_disbursements.funding_type IS 'Program code used by SFAS (award_disbursement.program_cde).';

COMMENT ON COLUMN sims.sfas_application_disbursements.funding_amount IS 'Amount of funding for this specific disbursement (award_disbursement.disbursement_amt).';

COMMENT ON COLUMN sims.sfas_application_disbursements.funding_date IS 'The earliest disbursement date (award_disbursement.disbursement_dte).';

COMMENT ON COLUMN sims.sfas_application_disbursements.date_issued IS 'The date this disbursement has been sent to the service provider (Issued_document.document_issue_dte).';

COMMENT ON COLUMN sims.sfas_application_disbursements.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.sfas_application_disbursements.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.sfas_application_disbursements.extracted_at IS 'Date that the record was extracted from SFAS.';

COMMENT ON INDEX sims.sfas_application_disbursements_application_id IS 'Index created on application_id to improve the performance of data retrieval.';