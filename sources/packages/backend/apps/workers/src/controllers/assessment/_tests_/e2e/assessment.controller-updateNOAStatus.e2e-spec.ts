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
import { AssessmentStatus } from "@sims/sims-db";
import { createFakeUpdateNOAStatusPayload } from "./update-noa-status-factory";
import { SystemUsersService } from "@sims/services";
import MockDate from "mockdate";

describe("AssessmentController(e2e)-updateNOAStatus", () => {
  let db: E2EDataSources;
  let assessmentController: AssessmentController;
  let systemUsersService: SystemUsersService;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    assessmentController = nestApplication.get(AssessmentController);
    systemUsersService = nestApplication.get(SystemUsersService);
  });

  it("Should update NOA status when noa approval status is null.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);

    const now = new Date();
    MockDate.set(now);

    const currentAssessment = savedApplication.currentAssessment!;

    // Act
    const result = await assessmentController.updateNOAStatus(
      createFakeUpdateNOAStatusPayload(currentAssessment.id),
    );

    // Asserts
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    // Asserts that the NOA approval status has changed to completed.
    const expectedAssessment = await db.studentAssessment.findOne({
      select: {
        id: true,
        noaApprovalStatus: true,
        noaApprovalStatusUpdatedOn: true,
        modifier: { id: true },
      },
      relations: { modifier: true },
      where: { id: currentAssessment.id },
    });
    const auditUser = systemUsersService.systemUser;
    expect(expectedAssessment).toEqual({
      id: currentAssessment.id,
      noaApprovalStatus: AssessmentStatus.required,
      noaApprovalStatusUpdatedOn: now,
      modifier: { id: auditUser.id },
    });
  });
});
