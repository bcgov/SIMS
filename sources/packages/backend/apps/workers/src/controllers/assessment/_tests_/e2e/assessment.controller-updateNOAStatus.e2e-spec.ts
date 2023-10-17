import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";

import { IOutputVariables } from "zeebe-node";
import {
  createFakeWorkerJob,
  FAKE_WORKER_JOB_RESULT_PROPERTY,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createTestingAppModule } from "../../../../../test/helpers";
import { AssessmentController } from "../../assessment.controller";
import {
  UpdateNOAStatusHeaderDTO,
  UpdateNOAStatusJobInDTO,
} from "../../assessment.dto";
import { AssessmentStatus } from "@sims/sims-db";
import { createFakeUpdateNOAStatusPayload } from "./update-noa-status";

describe("AssessmentController(e2e)-updateNOAStatus", () => {
  let db: E2EDataSources;
  let assessmentController: AssessmentController;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    assessmentController = nestApplication.get(AssessmentController);
  });

  it(`Should update NOA status when noa approval status is null.`, async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);
    const updateNOAStatusPayload = createFakeUpdateNOAStatusPayload(
      savedApplication.currentAssessment.id,
    );

    // Act
    const result = await assessmentController.updateNOAStatus(
      createFakeWorkerJob<
        UpdateNOAStatusJobInDTO,
        UpdateNOAStatusHeaderDTO,
        IOutputVariables
      >(updateNOAStatusPayload),
    );

    // Asserts
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    // Asserts that the NOA approval status has changed to completed.
    const expectedAssessment = await db.studentAssessment.findOne({
      select: {
        noaApprovalStatus: true,
      },
      where: { id: savedApplication.currentAssessment.id },
    });
    expect(expectedAssessment.noaApprovalStatus).toBe(
      AssessmentStatus.completed,
    );
  });
});
