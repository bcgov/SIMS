CREATE TABLE
  sims.returned_loan_customers (
    id SERIAL PRIMARY KEY,
    SIN CHAR(9) NOT NULL,
    last_name VARCHAR(40) NOT NULL,
    first_name VARCHAR(20),
    middle_names VARCHAR(40),
    initial_names VARCHAR(6),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(100) NOT NULL CHECK (
      sims.is_valid_system_lookup_key(
        gender :: TEXT,
        'Returned loan customer gender' :: TEXT
      )
    ),
    email VARCHAR(300),
    address_name VARCHAR(65),
    address_line_1 VARCHAR(50),
    address_line_2 VARCHAR(50),
    city VARCHAR(30),
    country VARCHAR(28),
    province_code VARCHAR(100) CHECK (
      sims.is_valid_system_lookup_key(province_code :: TEXT, 'Province' :: TEXT)
    ),
    postal_zip_code VARCHAR(15),
    home_phone VARCHAR(10),
    other_phone VARCHAR(10),
    address_effective_date DATE,
    address_end_date DATE,
    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creator INT NOT NULL REFERENCES sims.users (id),
    modifier INT NULL DEFAULT NULL REFERENCES sims.users (id)
  );

-- ## Comments
COMMENT ON TABLE sims.returned_loan_customers IS 'Customers associated with returned loans.';

COMMENT ON COLUMN sims.returned_loan_customers.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.returned_loan_customers.sin IS 'Customer number (Social Insurance Number).';

COMMENT ON COLUMN sims.returned_loan_customers.last_name IS 'Customer last name.';

COMMENT ON COLUMN sims.returned_loan_customers.first_name IS 'Customer first name.';

COMMENT ON COLUMN sims.returned_loan_customers.middle_names IS 'Customer middle names.';

COMMENT ON COLUMN sims.returned_loan_customers.initial_names IS 'Customer initial name.';

COMMENT ON COLUMN sims.returned_loan_customers.date_of_birth IS 'Customer birth date.';

COMMENT ON COLUMN sims.returned_loan_customers.gender IS 'Customer gender.';

COMMENT ON COLUMN sims.returned_loan_customers.email IS 'Customer email.';

COMMENT ON COLUMN sims.returned_loan_customers.address_name IS 'The name that should appear on mail outs for this address. This includes ''In Care Of'' addresses.';

COMMENT ON COLUMN sims.returned_loan_customers.address_line_1 IS 'Customer address line 1.';

COMMENT ON COLUMN sims.returned_loan_customers.address_line_2 IS 'Customer address line 2.';

COMMENT ON COLUMN sims.returned_loan_customers.city IS 'Customer address city.';

COMMENT ON COLUMN sims.returned_loan_customers.province_code IS 'Customer address province code. Applicable to Canadian address only.';

COMMENT ON COLUMN sims.returned_loan_customers.country IS 'Customer address country code.';

COMMENT ON COLUMN sims.returned_loan_customers.postal_zip_code IS 'Customer address postal code.';

COMMENT ON COLUMN sims.returned_loan_customers.home_phone IS 'Customer home phone number.';

COMMENT ON COLUMN sims.returned_loan_customers.other_phone IS 'Customer other phone number (Business or overseas).';

COMMENT ON COLUMN sims.returned_loan_customers.address_effective_date IS 'Date that the address information was last updated.';

COMMENT ON COLUMN sims.returned_loan_customers.address_end_date IS 'The date when the address is no longer valid.';

COMMENT ON COLUMN sims.returned_loan_customers.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.returned_loan_customers.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.returned_loan_customers.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.returned_loan_customers.modifier IS 'Modifier of the record.';