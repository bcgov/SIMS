import { TestingModule } from "@nestjs/testing";
import { getProviderInstanceForModule } from "@sims/test-utils";
import { AppStudentsModule } from "../../app.students.module";
import { AssessmentSequentialProcessingService } from "@sims/services";
import { StudentAssessment } from "@sims/sims-db";

/**
 * Mocks an outstanding student assessment for student in sequence info from
 * assessment sequential processing service to return the passed student assessment.
 * @param testingModule nest testing module.
 * @param assessment student assessment.
 */
export async function mockOutstandingAssessment(
  testingModule: TestingModule,
  assessment: StudentAssessment,
) {
  const assessmentService = await getProviderInstanceForModule(
    testingModule,
    AppStudentsModule,
    AssessmentSequentialProcessingService,
  );
  assessmentService.getOutstandingAssessmentsForStudentInSequence = jest
    .fn()
    .mockResolvedValue({
      id: assessment.id,
      originalAssessmentStudyStartDate: assessment.offering.studyStartDate,
    });
}
