import {
  Application,
  AssessmentTriggerType,
  EducationProgramOffering,
  StudentAssessment,
  User,
} from "../../database/entities";
import { createFakeUser } from "./user-fake";

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
