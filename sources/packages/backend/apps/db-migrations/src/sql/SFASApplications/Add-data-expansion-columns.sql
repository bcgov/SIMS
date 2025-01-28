ALTER TABLE
    sims.sfas_applications
ADD
    COLUMN application_number INT,
ADD
    COLUMN living_arrangements CHAR(1),
ADD
    COLUMN marital_status VARCHAR(4),
ADD
    COLUMN marriage_date DATE,
ADD
    COLUMN bc_residency_flag CHAR(1),
ADD
    COLUMN permanent_residency_flag CHAR(1),
ADD
    COLUMN gross_income_previous_year INT,
ADD
    COLUMN institution_code CHAR(4),
ADD
    COLUMN application_status_code CHAR(4),
ADD
    COLUMN education_period_weeks SMALLINT,
ADD
    COLUMN course_load SMALLINT,
ADD
    COLUMN assessed_costs_living_allowance NUMERIC(8, 2),
ADD
    COLUMN assessed_costs_extra_shelter NUMERIC(8, 2),
ADD
    COLUMN assessed_costs_child_care NUMERIC(8, 2),
ADD
    COLUMN assessed_costs_alimony NUMERIC(8, 2),
ADD
    COLUMN assessed_costs_local_transport NUMERIC(8, 2),
ADD
    COLUMN assessed_costs_return_transport NUMERIC(8, 2),
ADD
    COLUMN assessed_costs_tuition NUMERIC(8, 2),
ADD
    COLUMN assessed_costs_books_and_supplies NUMERIC(8, 2),
ADD
    COLUMN assessed_costs_exceptional_expenses NUMERIC(8, 2),
ADD
    COLUMN assessed_costs_other NUMERIC(8, 2),
ADD
    COLUMN assessed_costs_discretionary_expenses NUMERIC(8, 2),
ADD
    COLUMN withdrawal_date DATE,
ADD
    COLUMN withdrawal_reason CHAR(4),
ADD
    COLUMN withdrawal_active_flag CHAR(1);

COMMENT ON COLUMN sims.sfas_applications.application_number IS 'The unique application number assigned to this application (application_alias.application_no).';

COMMENT ON COLUMN sims.sfas_applications.living_arrangements IS '(Spouse/dependents/parents)|To verify information provided to SDPR for the purpose of determining or auditing eligibility (application.study_period_living_at_home_flg).';

COMMENT ON COLUMN sims.sfas_applications.marital_status IS 'Status (single, common law, married, separated, divorced). This is a code eg. MA for married (application_assessment.student_marital_status_cde).';

COMMENT ON COLUMN sims.sfas_applications.marriage_date IS 'Applicant''s marriage date (applicant_spouse.marriage_dte).';

COMMENT ON COLUMN sims.sfas_applications.bc_residency_flag IS 'Immigration status for student, BC residency (application.bc_residency_flag).';

COMMENT ON COLUMN sims.sfas_applications.permanent_residency_flag IS 'Permanent residency status (application.permanent_resident_flg).';

COMMENT ON COLUMN sims.sfas_applications.gross_income_previous_year IS 'Amount declared by the applicant on the application for gross income from previous year (applicant_income.income_amt  (applicant_income.applicant_owner_cde = ''A'' and applicant_income_.income_type_cde = ''APYI'')).';

COMMENT ON COLUMN sims.sfas_applications.institution_code IS 'The unique institution code for the institution that the applicant is attending (institution.institution_cde).';

COMMENT ON COLUMN sims.sfas_applications.application_status_code IS 'The latest application ''status code'' (application_status.application_status_cde).';

COMMENT ON COLUMN sims.sfas_applications.education_period_weeks IS 'The number of study weeks used in the assessment of this application (application_assessment.NO_OF_EDUC_PERIOD_WEEKS).';

COMMENT ON COLUMN sims.sfas_applications.course_load IS 'Course load in percentage (application.course_load_cde).';

COMMENT ON COLUMN sims.sfas_applications.assessed_costs_living_allowance IS 'Living allowance (assessment_v2.SP_EXP_LIVING_ALLOWANCE + assessment_v2.SP_EXP_LIV_ALLOW_DEPENDENTS).';

COMMENT ON COLUMN sims.sfas_applications.assessed_costs_extra_shelter IS 'Extra shelter (assessment_v2.SP_EXP_EXT_SHELTER_APPLICANT).';

COMMENT ON COLUMN sims.sfas_applications.assessed_costs_child_care IS 'Child care expenses (assessment_v2.SP_EXP_SUPERVISING_CHILDREN).';

COMMENT ON COLUMN sims.sfas_applications.assessed_costs_alimony IS 'Alimony (assessment_v2.SP_EXP_MAINTENANCE_ALIMONY).';

COMMENT ON COLUMN sims.sfas_applications.assessed_costs_local_transport IS 'Local transportation costs (assessment_v2.SP_EXP_EXT_LOCAL_TRANSPORT).';

COMMENT ON COLUMN sims.sfas_applications.assessed_costs_return_transport IS 'Return transportation costs (assessment_v2.SP_EXP_RETURN_TRANSPORT).';

COMMENT ON COLUMN sims.sfas_applications.assessed_costs_tuition IS 'Tuition costs (assessment_v2.SP_EXP_EDUC_TUITION).';

COMMENT ON COLUMN sims.sfas_applications.assessed_costs_books_and_supplies IS 'Books and supplies costs (assessment_v2.SP_EXP_EDUC_BOOKS_SUPPLIES).';

COMMENT ON COLUMN sims.sfas_applications.assessed_costs_exceptional_expenses IS 'Exceptional expenses (assessment_v2.SP_EXP_EDUC_INST_EXCEPTIONAL).';

COMMENT ON COLUMN sims.sfas_applications.assessed_costs_other IS 'Other expenses (assessment_v2.SP_EXP_EDUC_TRANSFER + assessment_v2.SP_EXP_EDUC_OTHER + assessment_v2.SP_EXP_STUDENT_LOAN_PMTS).';

COMMENT ON COLUMN sims.sfas_applications.assessed_costs_discretionary_expenses IS 'Discretionary expenses (assessment_v2.SP_EXP_OTHER).';

COMMENT ON COLUMN sims.sfas_applications.withdrawal_date IS 'Date of withdrawal from school (bcslwthd.withdrawal_dte).';

COMMENT ON COLUMN sims.sfas_applications.withdrawal_reason IS 'Reason for withdrawal (bcslwthd.withdrawal_rsn_cde).';

COMMENT ON COLUMN sims.sfas_applications.withdrawal_active_flag IS 'Flag stating if the withdrawal is reversed/canceled.';