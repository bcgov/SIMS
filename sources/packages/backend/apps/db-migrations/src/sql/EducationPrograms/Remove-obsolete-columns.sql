--Dropping column average_hours_study as it is obsolete.
ALTER TABLE
    sims.education_programs DROP COLUMN average_hours_study;

--Dropping column admission_requirement as it is obsolete.
ALTER TABLE
    sims.education_programs DROP COLUMN admission_requirement;

--Dropping column credential_type_other as it is obsolete.
ALTER TABLE
    sims.education_programs DROP COLUMN credential_type_other;