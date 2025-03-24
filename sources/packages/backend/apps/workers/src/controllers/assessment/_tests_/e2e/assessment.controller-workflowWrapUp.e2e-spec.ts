import {
  createE2EDataSources,
  createFakeDisbursementSchedule,
  createFakeEducationProgramOffering,
  createFakeStudentAppeal,
  createFakeStudentAssessment,
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
  Application,
  ApplicationStatus,
  AssessmentTriggerType,
  COEStatus,
  DisbursementScheduleStatus,
  OfferingIntensity,
  StudentAssessment,
  StudentAssessmentStatus,
  User,
  WorkflowData,
} from "@sims/sims-db";
import {
  AssessmentSequentialProcessingService,
  SystemUsersService,
  WorkflowClientService,
} from "@sims/services";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { StudentAssessmentService } from "../../../../services";
import { WorkflowWrapUpType } from "../../assessment.dto";

describe("AssessmentController(e2e)-workflowWrapUp", () => {
  let db: E2EDataSources;
  let assessmentController: AssessmentController;
  let systemUsersService: SystemUsersService;
  let studentAssessmentService: StudentAssessmentService;
  let assessmentSequentialProcessingService: AssessmentSequentialProcessingService;
  let workflowClientService: WorkflowClientService;
  let now: Date;
  let auditUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    assessmentController = nestApplication.get(AssessmentController);
    systemUsersService = nestApplication.get(SystemUsersService);
    studentAssessmentService = nestApplication.get(StudentAssessmentService);
    assessmentSequentialProcessingService = nestApplication.get(
      AssessmentSequentialProcessingService,
    );
    workflowClientService = nestApplication.get(WorkflowClientService);
    auditUser = systemUsersService.systemUser;
    now = new Date();
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it(`Should update assessment status to completed when it has the ${StudentAssessmentStatus.InProgress} status.`, async () => {
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
      createFakeWorkflowWrapUpPayload(savedApplication.currentAssessment.id, {
        workflowData,
      }),
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
    impactedApplication.currentAssessment.studentAppeal =
      createFakeStudentAppeal({
        application: impactedApplication,
      });
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
        { workflowData },
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
      impactedApplication.currentAssessment.studentAppeal.id,
    );
  });

  it(
    "Should find the next impacted assessment and create a reassessment when there is an application for the same student and program year in the future" +
      " and the future application has COE declined for all current assessment disbursements but has a disbursement sent from previous assessment.",
    async () => {
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
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
        },
      );

      const currentAssessment = createFakeStudentAssessment(
        {
          auditUser: student.user,
          application: impactedApplication,
          offering: impactedApplication.currentAssessment.offering,
        },
        {
          initialValue: {
            assessmentWorkflowId: "some fake id",
            triggerType: AssessmentTriggerType.ManualReassessment,
            studentAssessmentStatus: StudentAssessmentStatus.Completed,
            assessmentDate: addDays(2),
          },
        },
      );
      impactedApplication.currentAssessment = currentAssessment;
      await db.application.save(impactedApplication);

      // COE declined for current assessment disbursement.
      const currentAssessmentDisbursement = createFakeDisbursementSchedule(
        {
          studentAssessment: currentAssessment,
        },
        {
          initialValues: {
            coeStatus: COEStatus.declined,
            disbursementScheduleStatus: DisbursementScheduleStatus.Cancelled,
          },
        },
      );
      currentAssessment.disbursementSchedules = [currentAssessmentDisbursement];
      await db.studentAssessment.save(currentAssessment);
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

      // Assert
      expect(FakeWorkerJobResult.getResultType(result)).toBe(
        MockedZeebeJobResult.Complete,
      );
      // Asserts that the current student assessment is 'Related application changed' trigger type.
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
    },
  );

  it(
    "Should not find any next impacted assessment when there is an application for the same student and program year in the future" +
      " and the future application has COE declined for all assessment disbursements.",
    async () => {
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
      // Application in the future and COE declined.
      const futureApplication = await saveFakeApplicationDisbursements(
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
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.declined,
            disbursementScheduleStatus: DisbursementScheduleStatus.Cancelled,
          },
        },
      );
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

      // Assert
      expect(FakeWorkerJobResult.getResultType(result)).toBe(
        MockedZeebeJobResult.Complete,
      );
      // Asserts that the current assessment status has not changed.
      const expectedAssessmentApplication = await db.application.findOne({
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
          id: futureApplication.id,
        },
      });
      expect(expectedAssessmentApplication).toEqual({
        id: futureApplication.id,
        currentAssessment: {
          id: futureApplication.currentAssessment.id,
          triggerType: AssessmentTriggerType.OriginalAssessment,
        },
      });
    },
  );

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
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
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
      "updateAssessmentWrapUpData",
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
        { workflowData },
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

  it(
    "Should populate the previous date changed reported assessment when the e-Cert was generated for the 'Original Assessment' " +
      "and offering dates changed as a result of the reassessment.",
    async () => {
      // Arrange
      const savedApplication = await saveFakeApplicationDisbursements(
        db.dataSource,
        undefined,
        {
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentDate: now,
            studentAssessmentStatus: StudentAssessmentStatus.Completed,
          },
          createSecondDisbursement: false,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
        },
      );
      const originalAssessmentId = savedApplication.currentAssessment.id;
      const differentStudyStartDate = getISODateOnlyString(
        addDays(1, savedApplication.currentAssessment.offering.studyStartDate),
      );
      await saveOfferingAndAssessment(savedApplication, now, auditUser, null, {
        studyStartDate: differentStudyStartDate,
      });
      savedApplication.currentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.InProgress;
      await db.studentAssessment.save(savedApplication.currentAssessment);

      // Act
      const result = await assessmentController.workflowWrapUp(
        createFakeWorkflowWrapUpPayload(savedApplication.currentAssessment.id, {
          workflowData: {} as WorkflowData,
        }),
      );

      // Asserts
      expect(FakeWorkerJobResult.getResultType(result)).toBe(
        MockedZeebeJobResult.Complete,
      );
      const expectedAssessment = await db.studentAssessment.findOne({
        select: {
          id: true,
          previousDateChangedReportedAssessment: { id: true },
        },
        relations: {
          modifier: true,
          previousDateChangedReportedAssessment: true,
        },
        where: { id: savedApplication.currentAssessment.id },
      });
      expect(expectedAssessment.previousDateChangedReportedAssessment.id).toBe(
        originalAssessmentId,
      );
    },
  );

  it(
    "Should not populate the previous date changed reported assessment when the e-Cert was generated for the 'Original Assessment' " +
      "and offering dates didn't change as a result of the reassessment.",
    async () => {
      // Arrange
      const savedApplication = await saveFakeApplicationDisbursements(
        db.dataSource,
        undefined,
        {
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentDate: now,
            studentAssessmentStatus: StudentAssessmentStatus.Completed,
          },
          createSecondDisbursement: false,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
        },
      );
      await saveOfferingAndAssessment(savedApplication, now, auditUser, null, {
        studyStartDate:
          savedApplication.currentAssessment.offering.studyStartDate,
        studyEndDate: savedApplication.currentAssessment.offering.studyEndDate,
      });
      savedApplication.currentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.InProgress;
      await db.studentAssessment.save(savedApplication.currentAssessment);

      // Act
      const result = await assessmentController.workflowWrapUp(
        createFakeWorkflowWrapUpPayload(savedApplication.currentAssessment.id, {
          workflowData: {} as WorkflowData,
        }),
      );

      // Asserts
      expect(FakeWorkerJobResult.getResultType(result)).toBe(
        MockedZeebeJobResult.Complete,
      );
      const expectedAssessment = await db.studentAssessment.findOne({
        select: {
          id: true,
          previousDateChangedReportedAssessment: { id: true },
        },
        relations: {
          modifier: true,
          previousDateChangedReportedAssessment: true,
        },
        where: { id: savedApplication.currentAssessment.id },
      });
      expect(
        expectedAssessment.previousDateChangedReportedAssessment,
      ).toBeNull();
    },
  );

  it(
    "Should not populate the previous date changed reported assessment when the e-Cert is not generated for the 'Original Assessment' " +
      "and offering dates changed as a result of the reassessment.",
    async () => {
      // Arrange
      const savedApplication = await saveFakeApplicationDisbursements(
        db.dataSource,
        undefined,
        {
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentDate: now,
            studentAssessmentStatus: StudentAssessmentStatus.Completed,
          },
          createSecondDisbursement: false,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
          },
        },
      );
      const differentStudyStartDate = getISODateOnlyString(
        addDays(1, savedApplication.currentAssessment.offering.studyStartDate),
      );
      await saveOfferingAndAssessment(savedApplication, now, auditUser, null, {
        studyStartDate: differentStudyStartDate,
      });
      savedApplication.currentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.InProgress;
      await db.studentAssessment.save(savedApplication.currentAssessment);

      // Act
      const result = await assessmentController.workflowWrapUp(
        createFakeWorkflowWrapUpPayload(savedApplication.currentAssessment.id, {
          workflowData: {} as WorkflowData,
        }),
      );

      // Asserts
      expect(FakeWorkerJobResult.getResultType(result)).toBe(
        MockedZeebeJobResult.Complete,
      );
      const expectedAssessment = await db.studentAssessment.findOne({
        select: {
          id: true,
          previousDateChangedReportedAssessment: { id: true },
        },
        relations: {
          modifier: true,
          previousDateChangedReportedAssessment: true,
        },
        where: { id: savedApplication.currentAssessment.id },
      });
      expect(
        expectedAssessment.previousDateChangedReportedAssessment,
      ).toBeNull();
    },
  );

  it("Should populate the previous date changed reported assessment with the most recent reported reassessment when there are previously reported reassessments.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplicationDisbursements(
      db.dataSource,
      undefined,
      {
        applicationStatus: ApplicationStatus.Completed,
        currentAssessmentInitialValues: {
          assessmentDate: now,
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
        },
        createSecondDisbursement: false,
        firstDisbursementInitialValues: {
          coeStatus: COEStatus.completed,
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        },
      },
    );
    const originalAssessment = savedApplication.currentAssessment;
    const tomorrow = addDays(1, new Date());
    let differentStudyStartDate = getISODateOnlyString(
      addDays(1, originalAssessment.offering.studyStartDate),
    );
    const firstReassessment = await saveOfferingAndAssessment(
      savedApplication,
      tomorrow,
      auditUser,
      {
        previousDateChangedReportedAssessment: originalAssessment,
      },
      {
        studyStartDate: differentStudyStartDate,
        reportedDate: now,
      },
    );
    const dayAfterTomorrow = addDays(2, new Date());
    differentStudyStartDate = getISODateOnlyString(
      addDays(2, originalAssessment.offering.studyStartDate),
    );
    const latestReportedAssessment = await saveOfferingAndAssessment(
      savedApplication,
      dayAfterTomorrow,
      auditUser,
      {
        previousDateChangedReportedAssessment: firstReassessment,
      },
      {
        studyStartDate: differentStudyStartDate,
        reportedDate: now,
      },
    );
    const afterDayAfterTomorrow = addDays(3, new Date());
    differentStudyStartDate = getISODateOnlyString(
      addDays(3, originalAssessment.offering.studyStartDate),
    );
    await saveOfferingAndAssessment(
      savedApplication,
      afterDayAfterTomorrow,
      auditUser,
      null,
      {
        studyStartDate: differentStudyStartDate,
      },
    );
    savedApplication.currentAssessment.studentAssessmentStatus =
      StudentAssessmentStatus.InProgress;
    await db.studentAssessment.save(savedApplication.currentAssessment);

    // Act
    const result = await assessmentController.workflowWrapUp(
      createFakeWorkflowWrapUpPayload(savedApplication.currentAssessment.id, {
        workflowData: {} as WorkflowData,
      }),
    );

    // Asserts
    expect(FakeWorkerJobResult.getResultType(result)).toBe(
      MockedZeebeJobResult.Complete,
    );
    const expectedAssessment = await db.studentAssessment.findOne({
      select: {
        id: true,
        previousDateChangedReportedAssessment: { id: true },
      },
      relations: {
        modifier: true,
        previousDateChangedReportedAssessment: true,
      },
      where: { id: savedApplication.currentAssessment.id },
    });
    expect(expectedAssessment.previousDateChangedReportedAssessment.id).toBe(
      latestReportedAssessment.id,
    );
  });

  it(
    "Should not populate the previous date changed reported assessment if there are multiple reassessments where an intermediate reassessment has a different offering date " +
      "but the current one changed the offering date back to the value of the latest reported assessment.",
    async () => {
      // Arrange
      const savedApplication = await saveFakeApplicationDisbursements(
        db.dataSource,
        undefined,
        {
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentDate: now,
            studentAssessmentStatus: StudentAssessmentStatus.Completed,
          },
          createSecondDisbursement: false,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
        },
      );
      const originalAssessment = savedApplication.currentAssessment;
      const tomorrow = addDays(1, new Date());
      let differentStudyStartDate = getISODateOnlyString(
        addDays(1, originalAssessment.offering.studyStartDate),
      );
      const reportedReassessmentStudyStartDate = differentStudyStartDate;
      const reportedReassessmentStudyEndDate =
        originalAssessment.offering.studyEndDate;
      const firstReportedReassessment = await saveOfferingAndAssessment(
        savedApplication,
        tomorrow,
        auditUser,
        {
          previousDateChangedReportedAssessment: originalAssessment,
        },
        {
          studyStartDate: reportedReassessmentStudyStartDate,
          studyEndDate: reportedReassessmentStudyEndDate,
          reportedDate: now,
        },
      );
      const dayAfterTomorrow = addDays(2, new Date());
      differentStudyStartDate = getISODateOnlyString(
        addDays(2, originalAssessment.offering.studyStartDate),
      );
      await saveOfferingAndAssessment(
        savedApplication,
        dayAfterTomorrow,
        auditUser,
        {
          previousDateChangedReportedAssessment: firstReportedReassessment,
        },
        {
          studyStartDate: differentStudyStartDate,
        },
      );
      const afterDayAfterTomorrow = addDays(3, new Date());
      await saveOfferingAndAssessment(
        savedApplication,
        afterDayAfterTomorrow,
        auditUser,
        null,
        {
          studyStartDate: reportedReassessmentStudyStartDate,
          studyEndDate: reportedReassessmentStudyEndDate,
        },
      );
      savedApplication.currentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.InProgress;
      await db.studentAssessment.save(savedApplication.currentAssessment);

      // Act
      const result = await assessmentController.workflowWrapUp(
        createFakeWorkflowWrapUpPayload(savedApplication.currentAssessment.id, {
          workflowData: {} as WorkflowData,
        }),
      );

      // Asserts
      expect(FakeWorkerJobResult.getResultType(result)).toBe(
        MockedZeebeJobResult.Complete,
      );
      const expectedAssessment = await db.studentAssessment.findOne({
        select: {
          id: true,
          previousDateChangedReportedAssessment: { id: true },
        },
        relations: {
          modifier: true,
          previousDateChangedReportedAssessment: true,
        },
        where: { id: savedApplication.currentAssessment.id },
      });
      expect(
        expectedAssessment.previousDateChangedReportedAssessment,
      ).toBeNull();
    },
  );

  it(
    "Should not populate the previous date changed reported assessment if there are multiple reassessments where an intermediate reassessment has a different offering date " +
      "but the current one changed the offering dates back to the value of the last generated ecert when there are no report based reported assessments.",
    async () => {
      // Arrange
      const savedApplication = await saveFakeApplicationDisbursements(
        db.dataSource,
        undefined,
        {
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentDate: now,
            studentAssessmentStatus: StudentAssessmentStatus.Completed,
          },
          createSecondDisbursement: false,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
        },
      );
      const originalAssessment = savedApplication.currentAssessment;
      const originalAssessmentStudyStartDate =
        originalAssessment.offering.studyStartDate;
      const originalAssessmentStudyEndDate =
        originalAssessment.offering.studyEndDate;
      const tomorrow = addDays(1, new Date());
      const differentStudyStartDate = getISODateOnlyString(
        addDays(1, originalAssessment.offering.studyStartDate),
      );
      await saveOfferingAndAssessment(
        savedApplication,
        tomorrow,
        auditUser,
        {
          previousDateChangedReportedAssessment: originalAssessment,
        },
        {
          studyStartDate: differentStudyStartDate,
        },
      );
      const dayAfterTomorrow = addDays(2, new Date());
      await saveOfferingAndAssessment(
        savedApplication,
        dayAfterTomorrow,
        auditUser,
        null,
        {
          studyStartDate: originalAssessmentStudyStartDate,
          studyEndDate: originalAssessmentStudyEndDate,
        },
      );
      savedApplication.currentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.InProgress;
      await db.studentAssessment.save(savedApplication.currentAssessment);

      // Act
      const result = await assessmentController.workflowWrapUp(
        createFakeWorkflowWrapUpPayload(savedApplication.currentAssessment.id, {
          workflowData: {} as WorkflowData,
        }),
      );

      // Asserts
      expect(FakeWorkerJobResult.getResultType(result)).toBe(
        MockedZeebeJobResult.Complete,
      );
      const expectedAssessment = await db.studentAssessment.findOne({
        select: {
          id: true,
          previousDateChangedReportedAssessment: { id: true },
        },
        relations: {
          modifier: true,
          previousDateChangedReportedAssessment: true,
        },
        where: { id: savedApplication.currentAssessment.id },
      });
      expect(
        expectedAssessment.previousDateChangedReportedAssessment,
      ).toBeNull();
    },
  );

  it(`Should update only the assessment status to completed when the workflow wrapUpType header is set to ${WorkflowWrapUpType.AssessmentStatusOnly}.`, async () => {
    // Arrange
    const savedApplication = await saveFakeApplicationDisbursements(
      db.dataSource,
      undefined,
      {
        applicationStatus: ApplicationStatus.Edited,
        currentAssessmentInitialValues: {
          studentAssessmentStatus: StudentAssessmentStatus.InProgress,
        },
      },
    );
    // Monitor the below methods to ensure that they won't be called.
    const assessImpactedApplicationReassessmentNeededMock = jest.spyOn(
      assessmentSequentialProcessingService,
      "assessImpactedApplicationReassessmentNeeded",
    );
    const sendReleaseAssessmentCalculationMessageMock = jest.spyOn(
      workflowClientService,
      "sendReleaseAssessmentCalculationMessage",
    );

    // Act
    const result = await assessmentController.workflowWrapUp(
      createFakeWorkflowWrapUpPayload(savedApplication.currentAssessment.id, {
        wrapUpType: WorkflowWrapUpType.AssessmentStatusOnly,
      }),
    );

    // Assert
    expect(FakeWorkerJobResult.getResultType(result)).toBe(
      MockedZeebeJobResult.Complete,
    );
    const expectedAssessment = await db.studentAssessment.findOne({
      select: {
        id: true,
        studentAssessmentStatus: true,
        studentAssessmentStatusUpdatedOn: true,
      },
      where: { id: savedApplication.currentAssessment.id },
    });
    expect(expectedAssessment).toEqual({
      id: savedApplication.currentAssessment.id,
      studentAssessmentStatus: StudentAssessmentStatus.Completed,
      studentAssessmentStatusUpdatedOn: expect.any(Date),
    });
    // Ensures assessImpactedApplicationReassessmentNeeded was not called.
    expect(
      assessImpactedApplicationReassessmentNeededMock,
    ).not.toHaveBeenCalled();
    // Ensures sendReleaseAssessmentCalculationMessage was not called.
    expect(sendReleaseAssessmentCalculationMessageMock).not.toHaveBeenCalled();
  });

  /**
   * Saves an offering and assessment for that offering.
   * @param savedApplication related saved application.
   * @param assessmentDate related assessment date.
   * @param auditUser audit user.
   * @param relations related relations.
   * - `previousDateChangedReportedAssessment` previous date change reported assessment of the saved application.`
   * @param options related options.
   * - `studyStartDate` offering study start date.
   * - `studyEndDate` offering study end date.
   * - `reportedDate` date on which the assessment causing the study date change has been reported.
   * @returns saved offering change assessment.
   */
  async function saveOfferingAndAssessment(
    savedApplication: Application,
    assessmentDate: Date,
    auditUser: User,
    relations?: {
      previousDateChangedReportedAssessment?: StudentAssessment;
    },
    options?: {
      studyStartDate?: string;
      studyEndDate?: string;
      reportedDate?: Date;
    },
  ): Promise<StudentAssessment> {
    const updatedOffering = createFakeEducationProgramOffering(
      { auditUser, institutionLocation: savedApplication.location },
      {
        initialValues: {
          studyStartDate: options?.studyStartDate,
          studyEndDate: options?.studyEndDate,
        },
      },
    );
    const savedOffering = await db.educationProgramOffering.save(
      updatedOffering,
    );
    const offeringChangeAssessment = createFakeStudentAssessment(
      {
        application: savedApplication,
        auditUser,
        offering: savedOffering,
        previousDateChangedReportedAssessment:
          relations?.previousDateChangedReportedAssessment,
        applicationEditStatusUpdatedBy: auditUser,
      },
      {
        initialValue: {
          triggerType: AssessmentTriggerType.OfferingChange,
          assessmentDate,
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
          reportedDate: options?.reportedDate,
        },
      },
    );
    const savedOfferingChangeAssessment = await db.studentAssessment.save(
      offeringChangeAssessment,
    );
    savedApplication.currentAssessment = savedOfferingChangeAssessment;
    await db.application.save(savedApplication);
    return savedOfferingChangeAssessment;
  }
});
