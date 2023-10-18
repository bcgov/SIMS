import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  FAKE_WORKER_JOB_RESULT_PROPERTY,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createTestingAppModule } from "../../../../../test/helpers";
import { AssessmentController } from "../../assessment.controller";
import { createFakeSaveAssessmentDataPayload } from "./save-assessment-data-factory";

describe("AssessmentController(e2e)-saveAssessmentData", () => {
  let db: E2EDataSources;
  let assessmentController: AssessmentController;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    assessmentController = nestApplication.get(AssessmentController);
  });

  it("Should save student assessment data when it had not been updated yet.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);
    savedApplication.currentAssessment.assessmentData = null;
    await db.studentAssessment.save(savedApplication.currentAssessment);
    const assessmentData = { totalAssessmentNeed: 1111 };

    // Act
    const result = await assessmentController.saveAssessmentData(
      createFakeSaveAssessmentDataPayload(
        savedApplication.currentAssessment.id,
        assessmentData,
      ),
    );

    // Asserts
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    // Asserts that the assessment data is saved.
    const expectedAssessment = await db.studentAssessment.findOne({
      select: {
        assessmentData: true as unknown,
        assessmentDate: true,
      },
      where: { id: savedApplication.currentAssessment.id },
    });
    expect(expectedAssessment.assessmentData).toEqual(assessmentData);
    expect(expectedAssessment.assessmentDate).toBeInstanceOf(Date);
  });
});
