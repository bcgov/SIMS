import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { ICustomHeaders, IOutputVariables } from "zeebe-node";
import {
  createFakeWorkerJob,
  FAKE_WORKER_JOB_RESULT_PROPERTY,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createTestingAppModule } from "../../../../../test/helpers";
import { AssessmentController } from "../../assessment.controller";
import { SaveAssessmentDataJobInDTO } from "../../assessment.dto";
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
    const assessmentData = { totalAssessmentNeed: 9999 };

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
      },
      where: { id: savedApplication.currentAssessment.id },
    });
    expect(expectedAssessment.assessmentData).toEqual(assessmentData);
  });
});
