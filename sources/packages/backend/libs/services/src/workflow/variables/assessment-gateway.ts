/**
 * Represents the assessment being processed by the workflow.
 * Created while starting the assessment-gateway workflow.
 */
export const ASSESSMENT_ID = "assessmentId";
/**
 * Assessment dynamic data to be saved to the assessments table.
 */
export const ASSESSMENT_DATA = "assessmentData";
/**
 * Created while loading the assessment data.
 */
export const APPLICATION_ID = "applicationId";
/**
 * Institution location id selected by the student for
 * the application.
 */
export const STUDENT_DATA_SELECTED_LOCATION = "studentDataSelectedLocation";
/**
 * Institution offering program id if selected by the student.
 * If not selected a PIR will be needed.
 */
export const STUDENT_DATA_SELECTED_PROGRAM = "studentDataSelectedProgram";
/**
 * Created during the student application exception verifications
 * executed by the Ministry.
 * Declared inside assessment-gateway and updated during the regular timer
 * checks to verify its completion or when a message is sent to unblock
 * the workflow.
 */
export const APPLICATION_EXCEPTION_STATUS = "applicationExceptionStatus";
/**
 * Created during the student Program Info Request executed by the Institution.
 * Declared inside assessment-gateway and updated during the regular timer
 * checks to verify the PIR completion or when a message is sent to unblock
 * the workflow.
 */
export const PROGRAM_INFO_STATUS = "programInfoStatus";
/**
 * Represents all the disbursements schedules (1 or 2) and its loan/grants values.
 */
export const DISBURSEMENT_SCHEDULES = "disbursementSchedules";
