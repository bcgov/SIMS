import {
  createE2EDataSources,
  createFakeStudentAppeal,
  E2EDataSources,
  saveFakeApplication,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  FakeWorkerJobResult,
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
import {
  AssessmentSequentialProcessingService,
  SystemUsersService,
} from "@sims/services";
import { addDays } from "@sims/utilities";
import { StudentAssessmentService } from "../../../../services";

describe("AssessmentController(e2e)-workflowWrapUp", () => {
  let db: E2EDataSources;
  let assessmentController: AssessmentController;
  let systemUsersService: SystemUsersService;
  let studentAssessmentService: StudentAssessmentService;
  let assessmentSequentialProcessingService: AssessmentSequentialProcessingService;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    assessmentController = nestApplication.get(AssessmentController);
    systemUsersService = nestApplication.get(SystemUsersService);
    studentAssessmentService = nestApplication.get(StudentAssessmentService);
    assessmentSequentialProcessingService = nestApplication.get(
      AssessmentSequentialProcessingService,
    );
  });

  beforeEach(() => {
    jest.resetAllMocks();
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
    expect(FakeWorkerJobResult.getResultType(result)).toBe(
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

  it("Should find the next impacted assessment and create a reassessment when there is an application for the same student and program year in the future.", async () => {
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
    // Resets the workflow data to allow the wrap up worker to be executed.
    await db.studentAssessment.update(
      currentApplicationToWrapUp.currentAssessment.id,
      { workflowData: null },
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
          assessmentDate: addDays(1),
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
        },
      },
    );
    // Student appeal for the impacted application and its student assessment
    const studentAppeal = await createFakeStudentAppeal({
      application: impactedApplication,
      studentAssessment: impactedApplication.currentAssessment,
    });
    impactedApplication.currentAssessment.studentAppeal = studentAppeal;
    await db.studentAssessment.save(impactedApplication.currentAssessment);
    // Dummy workflowData to be saved during workflow wrap up.
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
    expect(FakeWorkerJobResult.getResultType(result)).toBe(
      MockedZeebeJobResult.Complete,
    );
    // Asserts that the student assessment status has changed to completed.
    const expectedAssessment = await db.application.findOne({
      select: {
        id: true,
        currentAssessment: {
          id: true,
          triggerType: true,
          studentAppeal: { id: true },
        },
      },
      relations: {
        currentAssessment: { studentAppeal: true },
      },
      where: {
        id: impactedApplication.id,
      },
    });
    expect(expectedAssessment.currentAssessment.triggerType).toBe(
      AssessmentTriggerType.RelatedApplicationChanged,
    );
    expect(expectedAssessment.currentAssessment.studentAppeal.id).toBe(
      studentAppeal.id,
    );
  });

  it("Should return job completed when the workflow data is already set.", async () => {
    // Arrange

    // Current application to have the workflow wrapped up.
    // The workflowData is automatically set by the factory.
    const currentApplicationToWrapUp = await saveFakeApplicationDisbursements(
      db.dataSource,
      undefined,
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
    // Dummy workflowData to be saved during workflow wrap up.
    const workflowData = {
      studentData: {
        dependantStatus: "independant",
      },
    } as WorkflowData;
    // Monitor the updateAssessmentStatusAndSaveWorkflowData to ensure that it will be called.
    const updateAssessmentStatusAndSaveWorkflowDataMock = jest.spyOn(
      studentAssessmentService,
      "updateAssessmentStatusAndSaveWorkflowData",
    );
    // Monitor the assessImpactedApplicationReassessmentNeeded to ensure that it will not be called.
    const assessImpactedApplicationReassessmentNeededMock = jest.spyOn(
      assessmentSequentialProcessingService,
      "assessImpactedApplicationReassessmentNeeded",
    );

    // Act
    const result = await assessmentController.workflowWrapUp(
      createFakeWorkflowWrapUpPayload(
        currentApplicationToWrapUp.currentAssessment.id,
        workflowData,
      ),
    );

    // Asserts
    expect(FakeWorkerJobResult.getResultType(result)).toBe(
      MockedZeebeJobResult.Complete,
    );
    // Ensures updateAssessmentStatusAndSaveWorkflowData was called.
    expect(updateAssessmentStatusAndSaveWorkflowDataMock).toHaveBeenCalled();
    // Ensures assessImpactedApplicationReassessmentNeeded was not called.
    expect(
      assessImpactedApplicationReassessmentNeededMock,
    ).not.toHaveBeenCalled();
  });
});
