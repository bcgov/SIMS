import { createFakeEducationProgramOffering } from "./education-program-offering";
import { createFakeApplication } from "./application";
import {
  Application,
  Assessment,
  AssessmentTriggerType,
  EducationProgramOffering,
  StudentAssessment,
  User,
} from "@sims/sims-db";

export function createFakeStudentAssessment(relations?: {
  auditUser: User;
  application?: Application;
  offering?: EducationProgramOffering;
}): StudentAssessment {
  const now = new Date();
  const assessment = new StudentAssessment();
  assessment.application = relations?.application ?? createFakeApplication();
  assessment.submittedDate = now;
  assessment.submittedBy = relations?.auditUser;
  assessment.assessmentWorkflowId = null;
  assessment.assessmentData = { totalAssessmentNeed: 9999 } as Assessment;
  assessment.assessmentDate = null;
  assessment.triggerType = AssessmentTriggerType.OriginalAssessment;
  assessment.offering =
    relations?.offering ??
    createFakeEducationProgramOffering({ auditUser: relations.auditUser });
  assessment.studentAppeal = null;
  assessment.studentScholasticStanding = null;
  assessment.noaApprovalStatus = null;
  assessment.disbursementSchedules = [];
  return assessment;
}
