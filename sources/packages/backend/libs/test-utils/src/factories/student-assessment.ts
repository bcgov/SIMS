import { createFakeEducationProgramOffering } from "./education-program-offering";
import { createFakeApplication } from "./application";
import {
  Application,
  Assessment,
  AssessmentTriggerType,
  DisbursementSchedule,
  DisbursementValue,
  EducationProgramOffering,
  StudentAppeal,
  StudentAssessment,
  StudentAssessmentStatus,
  User,
} from "@sims/sims-db";
import { createFakeDisbursementSchedule } from "@sims/test-utils/factories/disbursement-schedule";
import { E2EDataSources } from "@sims/test-utils/data-source/e2e-data-source";

/**
 * Creates a fake {@link StudentAssessment} object for testing purposes.
 * @param relations optional relations.
 * - `auditUser` user that created the record.
 * - `application` application.
 * - `offering` offering.
 * - `studentAppeal` student appeal.
 * - `previousDateChangedReportedAssessment` previous assessment that was changed.
 * - `applicationEditStatusUpdatedBy` user that updated the application edit status.
 * @param options initial values for {@link StudentAssessment}.
 * - `initialValue` initial values for the {@link StudentAssessment}.
 * - `isPIRPending` if the PIR is pending.
 * @returns a new {@link StudentAssessment} to be saved to the database.
 */
export function createFakeStudentAssessment(
  relations?: {
    auditUser: User;
    application?: Application;
    offering?: EducationProgramOffering;
    studentAppeal?: StudentAppeal;
    previousDateChangedReportedAssessment?: StudentAssessment;
    applicationEditStatusUpdatedBy?: User;
  },
  options?: {
    initialValue?: Partial<StudentAssessment>;
    isPIRPending?: boolean;
  },
): StudentAssessment {
  const now = new Date();
  const assessment = new StudentAssessment();
  assessment.application =
    relations?.application ?? createFakeApplication(relations);
  assessment.submittedDate = options?.initialValue?.submittedDate ?? now;
  assessment.submittedBy = relations?.auditUser;
  assessment.assessmentWorkflowId = null;
  assessment.assessmentData =
    options?.initialValue?.assessmentData ??
    ({ totalAssessmentNeed: 9999 } as Assessment);
  assessment.assessmentDate = options?.initialValue?.assessmentDate ?? null;
  assessment.triggerType =
    options?.initialValue?.triggerType ??
    AssessmentTriggerType.OriginalAssessment;
  assessment.offering =
    relations?.offering ??
    createFakeEducationProgramOffering(
      { auditUser: relations?.auditUser },
      { initialValues: options?.initialValue },
    );
  assessment.studentAppeal = relations?.studentAppeal ?? null;
  assessment.studentScholasticStanding = null;
  assessment.noaApprovalStatus = null;
  assessment.disbursementSchedules = [];
  assessment.studentAssessmentStatus =
    options?.initialValue?.studentAssessmentStatus ??
    StudentAssessmentStatus.Submitted;
  assessment.calculationStartDate =
    options?.initialValue?.calculationStartDate ?? null;
  assessment.previousDateChangedReportedAssessment =
    relations?.previousDateChangedReportedAssessment ?? null;
  assessment.reportedDate = options?.initialValue?.reportedDate ?? null;
  assessment.workflowData = options?.initialValue?.workflowData ?? null;
  // In the application if the PIR exists and is not completed, assessment will not have an offering.
  if (options?.isPIRPending) {
    assessment.offering = null;
  }
  assessment.eligibleApplicationAppeals =
    options?.initialValue?.eligibleApplicationAppeals ?? null;
  return assessment;
}

/**
 * Saves a new assessment associated with an application.
 * Useful to create scenarios where an application has multiple assessments.
 * @param db E2E data sources.
 * @param relations Assessment relations.
 * - `application` Application to which the assessment will be associated.
 * - `auditUser` User that created the record. If it is not provided,
 * the user from the application will be used, if available.
 * - `offering` Offering to which the assessment will be associated. If not provided,
 * the offering from the application current assessment will be used.
 * @param options Additional options.
 * - `initialValue` Initial values for the assessment.
 * - `firstDisbursementScheduleInitialValue` Initial values for the first
 * disbursement schedule to be created along with the assessment.
 * - `firstDisbursementValues` Disbursement values to be added to the first
 * disbursement schedule.
 * @returns The saved student assessment associated with the application.
 */
export function saveFakeStudentAssessment(
  db: E2EDataSources,
  relations: {
    application: Application;
    auditUser?: User;
    offering?: EducationProgramOffering;
  },
  options?: {
    initialValue?: Partial<StudentAssessment>;
    firstDisbursementScheduleInitialValue?: Partial<DisbursementSchedule>;
    firstDisbursementValues?: DisbursementValue[];
  },
): Promise<StudentAssessment> {
  const assessment = createFakeStudentAssessment({
    auditUser: relations.auditUser ?? relations.application.student.user,
    application: relations.application,
    offering:
      relations.offering ?? relations.application.currentAssessment.offering,
    ...options?.initialValue,
  });
  assessment.disbursementSchedules = [
    createFakeDisbursementSchedule(
      {
        disbursementValues: options?.firstDisbursementValues,
      },
      {
        initialValues: options?.firstDisbursementScheduleInitialValue,
      },
    ),
  ];
  return db.studentAssessment.save(assessment);
}
