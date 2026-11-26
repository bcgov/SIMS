CREATE TABLE
  sims.returned_loan_events (
    id SERIAL PRIMARY KEY,
    event_status sims.returned_loan_event_status NOT NULL,
    customer INT NOT NULL REFERENCES sims.returned_loan_customers (id),
    preceding_event INT REFERENCES sims.returned_loan_events (id),
    parent_event INT REFERENCES sims.returned_loan_events (id),
    event_status_updated_by INT REFERENCES sims.users (id),
    event_status_updated_on TIMESTAMP WITH TIME ZONE,
    return_reason VARCHAR(100) NOT NULL CHECK (
      sims.is_valid_system_lookup_key (
        return_reason::TEXT,
        'Returned loan reasons'::TEXT
      )
    ),
    file_name VARCHAR(50) NOT NULL,
    file_sequence_number INT NOT NULL,
    file_creation_date DATE NOT NULL,
    loan_type VARCHAR(2),
    loan_agreement_type VARCHAR(6),
    issuing_province CHAR(2),
    education_institution_code CHAR(4),
    loan_class CHAR(1),
    loan_identification_division_code CHAR(1) NOT NULL,
    loan_identification_loan_number INT NOT NULL,
    contract_number INT NOT NULL,
    consolidation_date DATE,
    event_date DATE,
    original_due_date DATE,
    calculated_limitation_start_date DATE,
    review_threshold_date DATE,
    study_end_month DATE,
    original_balance NUMERIC(8, 2),
    total_principal_outstanding NUMERIC(8, 2),
    accrued_interest NUMERIC(8, 2),
    total_returned_amount NUMERIC(8, 2),
    interest_owing_from_date DATE,
    interest_owing_to_date DATE,
    interest_rate_type CHAR(3),
    fixed_interest_rate NUMERIC(6, 4),
    variable_interest_spread NUMERIC(6, 4),
    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creator INT NOT NULL REFERENCES sims.users (id),
    modifier INT NULL DEFAULT NULL REFERENCES sims.users (id)
  );

-- ## Comments
COMMENT ON TABLE sims.returned_loan_events IS 'Returned loan events.';

COMMENT ON COLUMN sims.returned_loan_events.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.returned_loan_events.event_status IS 'Event status of the returned loan event.';

COMMENT ON COLUMN sims.returned_loan_events.customer IS 'Customer to whom the returned loan belongs to.';

COMMENT ON COLUMN sims.returned_loan_events.preceding_event IS 'The immediate previous version of the returned loan event.';

COMMENT ON COLUMN sims.returned_loan_events.parent_event IS 'The parent or first version of the returned loan event.';

COMMENT ON COLUMN sims.returned_loan_events.event_status_updated_by IS 'User who updated the event status.';

COMMENT ON COLUMN sims.returned_loan_events.event_status_updated_on IS 'Timestamp when the event status was updated.';

COMMENT ON COLUMN sims.returned_loan_events.return_reason IS 'Return reason.';

COMMENT ON COLUMN sims.returned_loan_events.file_name IS 'Returned loan file name.';

COMMENT ON COLUMN sims.returned_loan_events.file_sequence_number IS 'Returned loan file sequence number.';

COMMENT ON COLUMN sims.returned_loan_events.file_creation_date IS 'Returned loan file creation date.';

COMMENT ON COLUMN sims.returned_loan_events.loan_type IS 'Type of loan. FS - full-time loan, PS - part-time loan.';

COMMENT ON COLUMN sims.returned_loan_events.loan_agreement_type IS 'Type of loan agreement.';

COMMENT ON COLUMN sims.returned_loan_events.issuing_province IS 'Issuing province.';

COMMENT ON COLUMN sims.returned_loan_events.education_institution_code IS 'Education institution code.';

COMMENT ON COLUMN sims.returned_loan_events.loan_class IS 'Loan class.';

COMMENT ON COLUMN sims.returned_loan_events.loan_identification_division_code IS 'Service provider loan identification number - division code.';

COMMENT ON COLUMN sims.returned_loan_events.loan_identification_loan_number IS 'Service provider loan identification number - loan number.';

COMMENT ON COLUMN sims.returned_loan_events.contract_number IS 'Contract number.';

COMMENT ON COLUMN sims.returned_loan_events.consolidation_date IS 'Consolidation date.';

COMMENT ON COLUMN sims.returned_loan_events.event_date IS 'Date of ''Return to Government'' event.';

COMMENT ON COLUMN sims.returned_loan_events.original_due_date IS 'The final limitation start date provided by ministry user.';

COMMENT ON COLUMN sims.returned_loan_events.calculated_limitation_start_date IS 'The limitation start date calculated based on event date.';

COMMENT ON COLUMN sims.returned_loan_events.review_threshold_date IS 'Threshold date which is calculated based on file creation date to identify if calculated limitation start date falls within this date.';

COMMENT ON COLUMN sims.returned_loan_events.study_end_month IS 'Study end month stored as a date using first day of the month (e.g. 2026-10 is stored as 2026-10-01).';

COMMENT ON COLUMN sims.returned_loan_events.original_balance IS 'Original debt from this account.';

COMMENT ON COLUMN sims.returned_loan_events.total_principal_outstanding IS 'Total principal outstanding of the loan at time of return.';

COMMENT ON COLUMN sims.returned_loan_events.accrued_interest IS 'Accrued interest calculating from interest owing from date up to interest owing to date.';

COMMENT ON COLUMN sims.returned_loan_events.total_returned_amount IS 'Total returned amount.';

COMMENT ON COLUMN sims.returned_loan_events.interest_owing_from_date IS 'Interest owing from date.';

COMMENT ON COLUMN sims.returned_loan_events.interest_owing_to_date IS 'Interest owing to date.';

COMMENT ON COLUMN sims.returned_loan_events.interest_rate_type IS 'Interest rate type. FXD - fixed interest rate, PR+ - prime plus interest (variable).';

COMMENT ON COLUMN sims.returned_loan_events.fixed_interest_rate IS 'Interest rate (fixed rate).';

COMMENT ON COLUMN sims.returned_loan_events.variable_interest_spread IS 'Interest spread for floating rate.';

COMMENT ON COLUMN sims.returned_loan_events.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.returned_loan_events.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.returned_loan_events.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.returned_loan_events.modifier IS 'Modifier of the record.';