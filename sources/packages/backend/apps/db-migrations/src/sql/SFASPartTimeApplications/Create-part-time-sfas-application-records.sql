-- CREATE TABLE sfas_part_time_applications
CREATE TABLE IF NOT EXISTS sims.sfas_part_time_applications (
  id VARCHAR(10) PRIMARY KEY,
  individual_id INT NOT NULL,
  start_date DATE,
  end_date DATE,
  csgp_award NUMERIC(10),
  sbsd_award NUMERIC(10),
  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  extracted_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX sfas_part_time_applications_individual_id ON sims.sfas_part_time_applications(individual_id);

-- ## Comments
COMMENT ON TABLE sims.sfas_part_time_applications IS 'This record contain data related to an Student Application on SAIL(Part Time Application).';

COMMENT ON COLUMN sims.sfas_part_time_applications.id IS 'The unique key/number used in SFAS to identify this application (Sail_extract_data.sail_application_no ).';

COMMENT ON COLUMN sims.sfas_part_time_applications.individual_id IS 'The unique key/number used in SFAS to identify this individual (Sail_extract_data.individual_idx).';

COMMENT ON COLUMN sims.sfas_part_time_applications.start_date IS 'Educational program start date (Sail_extract_data.educ_start_dte).';

COMMENT ON COLUMN sims.sfas_part_time_applications.end_date IS 'Educational Program End date (Sail_extract_data.educ_end_dte).';

COMMENT ON COLUMN sims.sfas_part_time_applications.csgp_award IS 'CSGP Award Amount (sail_extract_data.sail_csgp_award_amt).';

COMMENT ON COLUMN sims.sfas_part_time_applications.sbsd_award IS 'SBSD Award Amount (sail_extract_data.sail_bcsl_sbsd_award_amt ).';

-- Audit columns
COMMENT ON COLUMN sims.sfas_part_time_applications.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.sfas_part_time_applications.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.sfas_part_time_applications.extracted_at IS 'Date that the record was extracted from SFAS.';