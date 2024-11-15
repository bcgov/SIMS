import { createFakeEducationProgramOffering } from "./education-program-offering";
import { createFakeApplication } from "./application";
import {
  Application,
  Assessment,
  AssessmentTriggerType,
  EducationProgramOffering,
  StudentAppeal,
  StudentAssessment,
  StudentAssessmentStatus,
  User,
} from "@sims/sims-db";

export function createFakeStudentAssessment(
  relations?: {
    auditUser: User;
    application?: Application;
    offering?: EducationProgramOffering;
    studentAppeal?: StudentAppeal;
    previousDateChangedReportedAssessment?: StudentAssessment;
  },
  options?: {
    initialValue?: Partial<StudentAssessment>;
    isPIRPending?: boolean;
  },
): StudentAssessment {
  const now = new Date();
  const assessment = new StudentAssessment();
  assessment.application = relations?.application ?? createFakeApplication();
  assessment.submittedDate = now;
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
  // In the application of the PIR exists and is not completed, assessment will not have an offering.
  if (options?.isPIRPending) {
    assessment.offering = null;
  }
  return assessment;
}
