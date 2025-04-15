import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockUserLoginInfo,
} from "../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
  getProviderInstanceForModule,
  saveFakeStudent,
  ensureProgramYearExists,
} from "@sims/test-utils";
import {
  APPLICATION_EDIT_STATUS_IN_PROGRESS_VALUES,
  ApplicationEditStatus,
  ApplicationStatus,
  ProgramYear,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import {
  APPLICATION_CHANGE_REQUEST_ALREADY_IN_PROGRESS,
  FormNames,
  FormService,
} from "../../../services";
import { AppStudentsModule } from "../../../app.students.module";
import { SaveApplicationAPIInDTO } from "apps/api/src/route-controllers/application/models/application.dto";

describe("ApplicationStudentsController(e2e)-applicationChangeRequest", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let programYear: ProgramYear;
  let defaultPayload: SaveApplicationAPIInDTO;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    // Program Year for the following tests.
    const formService = await getProviderInstanceForModule(
      appModule,
      AppStudentsModule,
      FormService,
    );
    programYear = await ensureProgramYearExists(db, 2050);
    // Change request default payload.
    defaultPayload = {
      associatedFiles: [],
      data: {},
      programYearId: programYear.id,
    } as SaveApplicationAPIInDTO;
    // Form.io mock.
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: FormNames.Application,
      data: { data: {} },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
  });

  it("Should create a change request when the application is completed.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const completedApplication = await saveFakeApplication(
      db.dataSource,
      { student, programYear },
      {
        applicationStatus: ApplicationStatus.Completed,
        studentNumber: "987654321",
      },
    );
    const endpoint = `/students/application/${completedApplication.id}/change-request`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    await mockUserLoginInfo(appModule, student);

    // Act/Assert
    let createApplicationId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(defaultPayload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        createApplicationId = response.body.id;
        expect(createApplicationId).toBeGreaterThan(0);
      });
    const createdApplication = await db.application.findOne({
      select: {
        id: true,
        submittedDate: true,
        applicationNumber: true,
        relationshipStatus: true,
        studentNumber: true,
        programYear: { id: true },
        offeringIntensity: true,
        location: { id: true },
        parentApplication: { id: true },
        precedingApplication: { id: true },
        student: { id: true },
        applicationStatus: true,
        applicationStatusUpdatedOn: true,
        applicationEditStatus: true,
        applicationEditStatusUpdatedOn: true,
        applicationEditStatusUpdatedBy: { id: true },
        currentAssessment: {
          id: true,
          studentAssessmentStatus: true,
          offering: { id: true },
          studentAppeal: { id: true },
        },
      },
      relations: {
        programYear: true,
        location: true,
        parentApplication: true,
        precedingApplication: true,
        student: true,
        applicationEditStatusUpdatedBy: true,
        currentAssessment: { offering: true, studentAppeal: true },
      },
      where: {
        id: createApplicationId,
      },
      loadEagerRelations: false,
    });
    expect(createdApplication).toEqual({
      id: expect.any(Number),
      submittedDate: expect.any(Date),
      applicationNumber: completedApplication.applicationNumber,
      relationshipStatus: completedApplication.relationshipStatus,
      studentNumber: completedApplication.studentNumber,
      programYear: expect.objectContaining({
        id: completedApplication.programYear.id,
      }),
      offeringIntensity: completedApplication.offeringIntensity,
      location: expect.objectContaining({
        id: completedApplication.location.id,
      }),
      parentApplication: expect.objectContaining({
        id: completedApplication.id,
      }),
      precedingApplication: expect.objectContaining({
        id: completedApplication.id,
      }),
      student: expect.objectContaining({ id: student.id }),
      applicationStatus: ApplicationStatus.Edited,
      applicationStatusUpdatedOn: expect.any(Date),
      applicationEditStatus: ApplicationEditStatus.ChangeInProgress,
      applicationEditStatusUpdatedOn: expect.any(Date),
      applicationEditStatusUpdatedBy: expect.objectContaining({
        id: expect.any(Number),
      }),
      currentAssessment: expect.objectContaining({
        id: expect.any(Number),
        studentAssessmentStatus: StudentAssessmentStatus.Submitted,
        offering: { id: completedApplication.currentAssessment.offering.id },
        studentAppeal: null,
      }),
    });
  });

  describe("Should throw an UnprocessableEntity exception when the application edit status is considered 'in-progress'", () => {
    APPLICATION_EDIT_STATUS_IN_PROGRESS_VALUES.forEach((status) => {
      it(`with an edit status defined as '${status}'.`, async () => {
        // Arrange
        const student = await saveFakeStudent(db.dataSource);
        const completedApplication = await saveFakeApplication(
          db.dataSource,
          { student, programYear },
          {
            applicationStatus: ApplicationStatus.Completed,
          },
        );
        await saveFakeApplication(
          db.dataSource,
          {
            student,
            programYear,
            parentApplication: completedApplication,
            precedingApplication: completedApplication,
          },
          {
            applicationStatus: ApplicationStatus.Edited,
            applicationEditStatus: status,
            applicationNumber: completedApplication.applicationNumber,
          },
        );
        const endpoint = `/students/application/${completedApplication.id}/change-request`;
        const token = await getStudentToken(
          FakeStudentUsersTypes.FakeStudentUserType1,
        );
        await mockUserLoginInfo(appModule, student);

        // Act/Assert
        await request(app.getHttpServer())
          .post(endpoint)
          .send(defaultPayload)
          .auth(token, BEARER_AUTH_TYPE)
          .expect(HttpStatus.UNPROCESSABLE_ENTITY)
          .expect({
            message: "An application change request is already in progress.",
            errorType: APPLICATION_CHANGE_REQUEST_ALREADY_IN_PROGRESS,
          });
      });
    });
  });

  it("Should throw a Unauthorized exception when the student does not have a valid SIN.", async () => {
    // Arrange

    // Application created with the default student without a valid SIN.
    const completedApplication = await saveFakeApplication(
      db.dataSource,
      undefined,
      {
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    const endpoint = `/students/application/${completedApplication.id}/change-request`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    await mockUserLoginInfo(appModule, completedApplication.student);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(defaultPayload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNAUTHORIZED)
      .expect({
        message: "A valid SIN is required to access this resource.",
        error: "Unauthorized",
        statusCode: HttpStatus.UNAUTHORIZED,
      });
  });

  it("Should throw an UnprocessableEntity exception when a change request submission happen for a not allowed program year.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const completedApplication = await saveFakeApplication(
      db.dataSource,
      { student },
      {
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    const endpoint = `/students/application/${completedApplication.id}/change-request`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    await mockUserLoginInfo(appModule, student);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(defaultPayload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "The program year associated to this application does not allow a change request submission.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
