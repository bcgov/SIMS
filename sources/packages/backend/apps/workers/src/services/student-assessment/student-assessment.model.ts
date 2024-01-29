import { StudentAssessment } from "@sims/sims-db";

/**
 * Student assessment detail consisting of original assessment study start date
 * of the application to which the assessment belongs to.
 ** An application has a original assessment and can have one or more re-assessments.
 ** But to calculate the assessments in sequence(across different applications or within same application),
 ** the study start date of only the original assessment is considered to determine the order and hence
 ** it is required in the result of sequentially ordered assessment details for a student.
 */
export class StudentAssessmentDetail extends StudentAssessment {
  originalAssessmentStudyStartDate: Date;
}
