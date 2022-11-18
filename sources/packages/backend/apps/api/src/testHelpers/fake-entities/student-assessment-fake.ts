import {
  Application,
  AssessmentTriggerType,
  EducationProgramOffering,
  StudentAssessment,
  User,
} from "@sims/sims-db";
import { createFakeUser } from "@sims/test-utils";

export function createFakeStudentAssessment(
  application?: Application,
  user?: User,
  offering?: EducationProgramOffering,
): StudentAssessment {
  const assessment = new StudentAssessment();
  assessment.offering = offering;
  assessment.application = application;
  assessment.submittedDate = new Date();
  assessment.submittedBy = user ?? createFakeUser();
  assessment.triggerType = AssessmentTriggerType.OriginalAssessment;
  return assessment;
}
