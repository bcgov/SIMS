import {
  createE2EDataSources,
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
} from "@sims/services";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { StudentAssessmentService } from "../../../../services";

describe("AssessmentController(e2e)-workflowWrapUp", () => {
  let db: E2EDataSources;
  let assessmentController: AssessmentController;
  let systemUsersService: SystemUsersService;
  let studentAssessmentService: StudentAssessmentService;
  let assessmentSequentialProcessingService: AssessmentSequentialProcessingService;
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
      impactedApplication.currentAssessment.studentAppeal.id,
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

  it("Should populate the previous date changed reported assessment when the e-Cert was generated for the 'Original Assessment' and offering dates changed as a result of the reassessment.", async () => {
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
    await saveOfferingAndAssessment(savedApplication, now, auditUser, {
      studyStartDate: getISODateOnlyString(differentStudyStartDate),
    });
    savedApplication.currentAssessment.studentAssessmentStatus =
      StudentAssessmentStatus.InProgress;
    await db.studentAssessment.save(savedApplication.currentAssessment);

    // Act
    const result = await assessmentController.workflowWrapUp(
      createFakeWorkflowWrapUpPayload(
        savedApplication.currentAssessment.id,
        {} as WorkflowData,
      ),
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
  });

  it("Should not populate the previous date changed reported assessment when the e-Cert was generated for the 'Original Assessment' and offering dates didn't change as a result of the reassessment.", async () => {
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
    await saveOfferingAndAssessment(savedApplication, now, auditUser, {
      studyStartDate:
        savedApplication.currentAssessment.offering.studyStartDate,
      studyEndDate: savedApplication.currentAssessment.offering.studyEndDate,
    });
    savedApplication.currentAssessment.studentAssessmentStatus =
      StudentAssessmentStatus.InProgress;
    await db.studentAssessment.save(savedApplication.currentAssessment);

    // Act
    const result = await assessmentController.workflowWrapUp(
      createFakeWorkflowWrapUpPayload(
        savedApplication.currentAssessment.id,
        {} as WorkflowData,
      ),
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
    expect(expectedAssessment.previousDateChangedReportedAssessment).toBeNull();
  });

  it("Should not populate the previous date changed reported assessment when the e-Cert is not generated for the 'Original Assessment' and offering dates changed as a result of the reassessment.", async () => {
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
    await saveOfferingAndAssessment(savedApplication, now, auditUser, {
      studyStartDate: getISODateOnlyString(differentStudyStartDate),
    });
    savedApplication.currentAssessment.studentAssessmentStatus =
      StudentAssessmentStatus.InProgress;
    await db.studentAssessment.save(savedApplication.currentAssessment);

    // Act
    const result = await assessmentController.workflowWrapUp(
      createFakeWorkflowWrapUpPayload(
        savedApplication.currentAssessment.id,
        {} as WorkflowData,
      ),
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
    expect(expectedAssessment.previousDateChangedReportedAssessment).toBeNull();
  });

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
        studyStartDate: differentStudyStartDate,
        reportedDate: now,
        previousDateChangedReportedAssessment: originalAssessment,
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
        studyStartDate: differentStudyStartDate,
        reportedDate: now,
        previousDateChangedReportedAssessment: firstReassessment,
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
      {
        studyStartDate: differentStudyStartDate,
      },
    );
    savedApplication.currentAssessment.studentAssessmentStatus =
      StudentAssessmentStatus.InProgress;
    await db.studentAssessment.save(savedApplication.currentAssessment);

    // Act
    const result = await assessmentController.workflowWrapUp(
      createFakeWorkflowWrapUpPayload(
        savedApplication.currentAssessment.id,
        {} as WorkflowData,
      ),
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

  it("Should not populate the previous date changed reported assessment if there are multiple reassessments where an intermediate reassessment has a different offering date but the current one changed the offering date back to the value of the latest reported assessment.", async () => {
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
    let differentStudyStartDate = addDays(
      1,
      originalAssessment.offering.studyStartDate,
    );
    const reportedReassessmentStudyStartDate = getISODateOnlyString(
      differentStudyStartDate,
    );
    const reportedReassessmentStudyEndDate = getISODateOnlyString(
      originalAssessment.offering.studyEndDate,
    );
    const firstReportedReassessment = await saveOfferingAndAssessment(
      savedApplication,
      tomorrow,
      auditUser,
      {
        studyStartDate: reportedReassessmentStudyStartDate,
        studyEndDate: reportedReassessmentStudyEndDate,
        reportedDate: now,
        previousDateChangedReportedAssessment: originalAssessment,
      },
    );
    const dayAfterTomorrow = addDays(2, new Date());
    differentStudyStartDate = addDays(
      2,
      originalAssessment.offering.studyStartDate,
    );
    await saveOfferingAndAssessment(
      savedApplication,
      dayAfterTomorrow,
      auditUser,
      {
        studyStartDate: getISODateOnlyString(differentStudyStartDate),
        previousDateChangedReportedAssessment: firstReportedReassessment,
      },
    );
    const afterDayAfterTomorrow = addDays(3, new Date());
    await saveOfferingAndAssessment(
      savedApplication,
      afterDayAfterTomorrow,
      auditUser,
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
      createFakeWorkflowWrapUpPayload(
        savedApplication.currentAssessment.id,
        {} as WorkflowData,
      ),
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
    expect(expectedAssessment.previousDateChangedReportedAssessment).toBeNull();
  });

  it("Should not populate the previous date changed reported assessment if there are multiple reassessments where an intermediate reassessment has a different offering date but the current one changed the offering dates back to the value of the last generated ecert when there are no report based reported assessments.", async () => {
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
    const originalAssessmentStudyStartDate = getISODateOnlyString(
      originalAssessment.offering.studyStartDate,
    );
    const originalAssessmentStudyEndDate = getISODateOnlyString(
      originalAssessment.offering.studyEndDate,
    );
    const tomorrow = addDays(1, new Date());
    const differentStudyStartDate = addDays(
      1,
      originalAssessment.offering.studyStartDate,
    );
    await saveOfferingAndAssessment(savedApplication, tomorrow, auditUser, {
      studyStartDate: getISODateOnlyString(differentStudyStartDate),
      previousDateChangedReportedAssessment: originalAssessment,
    });
    const dayAfterTomorrow = addDays(2, new Date());
    await saveOfferingAndAssessment(
      savedApplication,
      dayAfterTomorrow,
      auditUser,
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
      createFakeWorkflowWrapUpPayload(
        savedApplication.currentAssessment.id,
        {} as WorkflowData,
      ),
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
    expect(expectedAssessment.previousDateChangedReportedAssessment).toBeNull();
  });

  /**
   * Saves an offering and assessment for that offering.
   * @param savedApplication related saved application.
   * @param assessmentDate related assessment date.
   * @param auditUser audit user.
   * @param options related options.
   * - `studyStartDate` offering study start date.
   * - `studyEndDate` offering study end date.
   * - `reportedDate` date on which the assessment causing the study date change has been reported.
   * - `previousDateChangedReportedAssessment` previous date change reported assessment of the saved application.
   * @returns saved offering change assessment.
   */
  async function saveOfferingAndAssessment(
    savedApplication: Application,
    assessmentDate: Date,
    auditUser: User,
    options?: {
      studyStartDate?: string;
      studyEndDate?: string;
      reportedDate?: Date;
      previousDateChangedReportedAssessment?: StudentAssessment;
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
    const initialValue = {
      triggerType: AssessmentTriggerType.OfferingChange,
      assessmentDate,
      studentAssessmentStatus: StudentAssessmentStatus.Completed,
    };
    if (options?.reportedDate) {
      initialValue["reportedDate"] = options?.reportedDate;
      initialValue["previousDateChangedReportedAssessment"] =
        options?.previousDateChangedReportedAssessment;
    }
    const offeringChangeAssessment = createFakeStudentAssessment(
      {
        application: savedApplication,
        auditUser,
        offering: savedOffering,
      },
      {
        initialValue,
      },
    );
    const savedOfferingChangeAssessment = await db.studentAssessment.save(
      offeringChangeAssessment,
    );
    savedApplication.currentAssessment = savedOfferingChangeAssessment;
    return savedOfferingChangeAssessment;
  }
});
