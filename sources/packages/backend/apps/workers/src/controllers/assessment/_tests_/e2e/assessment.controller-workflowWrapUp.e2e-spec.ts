import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  FAKE_WORKER_JOB_RESULT_PROPERTY,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createTestingAppModule } from "../../../../../test/helpers";
import { createFakeWorkflowWrapUpPayload } from "./workflow-wrap-up-factory";
import { AssessmentController } from "../../assessment.controller";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  OfferingIntensity,
  StudentAssessmentStatus,
  WorkflowData,
} from "@sims/sims-db";
import { SystemUsersService } from "@sims/services";
import { addDays } from "@sims/utilities";

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

    // Act
    const result = await assessmentController.workflowWrapUp(
      createFakeWorkflowWrapUpPayload(
        savedApplication.currentAssessment.id,
        workflowData,
      ),
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
    const auditUser = systemUsersService.systemUser;
    expect(expectedAssessment.modifier).toEqual(auditUser);
    expect(expectedAssessment.updatedAt).toBeInstanceOf(Date);
  });

  it.only("Should find the next impacted assessment and create a reassessment when there is an application for the same student and program year in the future.", async () => {
    // Arrange

    // Create the student to be shared across the applications.
    const student = await saveFakeStudent(db.dataSource);
    // Current application to have the workflow wrapped up.
    const currentApplicationToWrapUp = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Assessment,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          assessmentDate: new Date(),
          studentAssessmentStatus: StudentAssessmentStatus.InProgress,
        },
      },
    );
    // Application in the future of the currentApplicationToWrapUp.
    const impactedApplication = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          assessmentDate: addDays(1, new Date()),
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
        },
      },
    );
    impactedApplication.applicationNumber =
      currentApplicationToWrapUp.applicationNumber;
    await db.application.save(impactedApplication);

    const workflowData = {
      studentData: {
        dependantStatus: "independant",
      },
    } as WorkflowData;

    // Act
    const result = await assessmentController.workflowWrapUp(
      createFakeWorkflowWrapUpPayload(
        currentApplicationToWrapUp.currentAssessment.id,
        workflowData,
      ),
    );

    // Asserts
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    // Asserts that the student assessment status has changed to completed.
    const expectedAssessment = await db.application.findOne({
      select: {
        id: true,
        currentAssessment: {
          id: true,
          triggerType: true,
        },
      },
      relations: {
        currentAssessment: true,
      },
      where: {
        id: impactedApplication.id,
      },
    });
    expect(expectedAssessment.currentAssessment.triggerType).toBe(
      AssessmentTriggerType.RelatedApplicationChanged,
    );
  });
});
