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
import { createFakeWorkflowWrapUpPayload } from "./workflow-wrap-up-factory";
import { AssessmentController } from "../../assessment.controller";
import { WorkflowWrapUpJobInDTO } from "../../assessment.dto";
import { StudentAssessmentStatus, WorkflowData } from "@sims/sims-db";
import { SystemUsersService } from "@sims/services";

describe("AssessmentController(e2e)-workflowWrapUp", () => {
  let db: E2EDataSources;
  let assessmentController: AssessmentController;
  let systemUsersService: SystemUsersService;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    assessmentController = nestApplication.get(AssessmentController);
    systemUsersService = nestApplication.get(SystemUsersService);
  });

  it(`Should update assessment status to completed when it does not have a status ${StudentAssessmentStatus.InProgress}.`, async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);
    const workflowData = {
      studentData: {
        dependantStatus: "independant",
      },
    } as WorkflowData;
    savedApplication.currentAssessment.studentAssessmentStatus =
      StudentAssessmentStatus.InProgress;
    await db.studentAssessment.save(savedApplication.currentAssessment);
    const workflowWrapUpPayload = createFakeWorkflowWrapUpPayload(
      savedApplication.currentAssessment.id,
      workflowData,
    );

    // Act
    const result = await assessmentController.workflowWrapUp(
      createFakeWorkerJob<
        WorkflowWrapUpJobInDTO,
        ICustomHeaders,
        IOutputVariables
      >(workflowWrapUpPayload),
    );

    // Asserts
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    // Asserts that the student assessment status has changed to completed.
    const expectedAssessment = await db.studentAssessment.findOne({
      select: {
        id: true,
        studentAssessmentStatus: true,
        workflowData: true as unknown,
        studentAssessmentStatusUpdatedOn: true,
        modifier: { id: true },
        updatedAt: true,
      },
      relations: { modifier: true },
      where: { id: savedApplication.currentAssessment.id },
    });
    expect(expectedAssessment.studentAssessmentStatus).toBe(
      StudentAssessmentStatus.Completed,
    );
    expect(expectedAssessment.workflowData).toEqual(workflowData);
    expect(expectedAssessment.studentAssessmentStatusUpdatedOn).toBeInstanceOf(
      Date,
    );
    const auditUser = await systemUsersService.systemUser();
    expect(expectedAssessment.modifier).toEqual(auditUser);
    expect(expectedAssessment.updatedAt).toBeInstanceOf(Date);
  });
});
