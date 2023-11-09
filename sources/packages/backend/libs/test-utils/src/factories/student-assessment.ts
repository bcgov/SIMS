import { createFakeEducationProgramOffering } from "./education-program-offering";
import { createFakeApplication } from "./application";
import {
  Application,
  Assessment,
  AssessmentTriggerType,
  EducationProgramOffering,
  StudentAssessment,
  StudentAssessmentStatus,
  User,
} from "@sims/sims-db";

export function createFakeStudentAssessment(
  relations?: {
    auditUser: User;
    application?: Application;
    offering?: EducationProgramOffering;
  },
  options?: { initialValue?: Partial<StudentAssessment> },
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
    createFakeEducationProgramOffering({ auditUser: relations?.auditUser });
  assessment.studentAppeal = null;
  assessment.studentScholasticStanding = null;
  assessment.noaApprovalStatus = null;
  assessment.disbursementSchedules = [];
  assessment.studentAssessmentStatus =
    options?.initialValue?.studentAssessmentStatus ??
    StudentAssessmentStatus.Submitted;
  return assessment;
}
