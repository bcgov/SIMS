CREATE TABLE sims.application_offering_change_requests (
  id SERIAL PRIMARY KEY,
  application_id INT NOT NULL REFERENCES sims.applications(id),
  requested_offering_id INT NOT NULL REFERENCES sims.education_programs_offerings(id),
  active_offering_id INT NOT NULL REFERENCES sims.education_programs_offerings(id),
  application_offering_change_request_status sims.application_offering_change_request_status_types NOT NULL,
  assessed_date TIMESTAMP WITH TIME ZONE,
  assessed_by INT REFERENCES sims.users(id),
  student_action_date TIMESTAMP WITH TIME ZONE,
  reason VARCHAR(500) NOT NULL,
  assessed_note_id INT REFERENCES sims.notes(id),
  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW (),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW (),
  creator INT NULL DEFAULT NULL REFERENCES sims.users(id),
  modifier INT NULL DEFAULT NULL REFERENCES sims.users(id)
);

-- ## Comments
COMMENT ON TABLE sims.application_offering_change_requests IS 'Represents the list of application specific offering change requests, which is requested by institution.';

COMMENT ON COLUMN sims.application_offering_change_requests.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.application_offering_change_requests.application_id IS 'Application on which the application specific offering change was requested.';

COMMENT ON COLUMN sims.application_offering_change_requests.requested_offering_id IS 'The new or existing offering assigned by the institution for the application specific offering change.';

COMMENT ON COLUMN sims.application_offering_change_requests.active_offering_id IS 'The actual offering of the application that was requested for the application specific offering change.';

COMMENT ON COLUMN sims.application_offering_change_requests.application_offering_change_request_status IS 'Current status of application specific offering request change (e.g. In progress with student, In progress with SABC, Approved, Declined by student, Declined by SABC).';

COMMENT ON COLUMN sims.application_offering_change_requests.assessed_date IS 'Date that the Ministry approved or denied the application specific offering request change.';

COMMENT ON COLUMN sims.application_offering_change_requests.assessed_by IS 'Ministry user that approved or denied the application specific offering request change.';

COMMENT ON COLUMN sims.application_offering_change_requests.student_action_date IS 'Date that the Student approved or denied the application specific offering request change.';

COMMENT ON COLUMN sims.application_offering_change_requests.reason IS 'The reason for application specific offering request change added by institution.';

COMMENT ON COLUMN sims.application_offering_change_requests.assessed_note_id IS 'Note added by the Ministry while approving or denying the application specific offering request change.';

COMMENT ON COLUMN sims.application_offering_change_requests.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.application_offering_change_requests.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.application_offering_change_requests.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.application_offering_change_requests.modifier IS 'Modifier of the record.';