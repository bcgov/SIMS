import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockUserLoginInfo,
  createPYStudentApplicationFormConfiguration,
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
  RelationshipStatus,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import {
  APPLICATION_CHANGE_REQUEST_ALREADY_IN_PROGRESS,
  DynamicFormConfigurationService,
  FormNames,
  FormService,
} from "../../../services";
import { AppStudentsModule } from "../../../app.students.module";
import { SaveApplicationAPIInDTO } from "../models/application.dto";
import MockDate from "mockdate";

describe("ApplicationStudentsController(e2e)-applicationChangeRequest", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let programYear: ProgramYear;
  let defaultPayload: SaveApplicationAPIInDTO;
  let dynamicFormConfigurationService: DynamicFormConfigurationService;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    dynamicFormConfigurationService = app.get(DynamicFormConfigurationService);
    // Program Year for the following tests.
    const formService = await getProviderInstanceForModule(
      appModule,
      AppStudentsModule,
      FormService,
    );
    programYear = await ensureProgramYearExists(db, 2050);
    // Ensure the dynamic form configuration for the program year.
    await createPYStudentApplicationFormConfiguration(
      db,
      programYear,
      dynamicFormConfigurationService,
    );
    // Application mocked data.
    const data = {
      relationshipStatus: RelationshipStatus.Other,
      studentNumber: "123456789",
    };
    // Change request default payload.
    defaultPayload = {
      associatedFiles: [],
      data,
      programYearId: programYear.id,
    } as SaveApplicationAPIInDTO;
    // Form.io mock.
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: FormNames.Application,
      data: { data },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
  });

  beforeEach(async () => {
    MockDate.reset();
  });

  it("Should create a change request when the application is completed.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const completedApplication = await saveFakeApplication(
      db.dataSource,
      { student, programYear },
      {
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    const endpoint = `/students/application/${completedApplication.id}/change-request`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    await mockUserLoginInfo(appModule, student);
    const now = new Date();
    MockDate.set(now);

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
          studentAssessmentStatusUpdatedOn: true,
          offering: { id: true },
          studentAppeal: { id: true },
          creator: { id: true },
          createdAt: true,
        },
      },
      relations: {
        programYear: true,
        location: true,
        parentApplication: true,
        precedingApplication: true,
        student: true,
        applicationEditStatusUpdatedBy: true,
        currentAssessment: {
          offering: true,
          studentAppeal: true,
          creator: true,
        },
      },
      where: {
        id: createApplicationId,
      },
      loadEagerRelations: false,
    });
    expect(createdApplication).toEqual({
      id: createApplicationId,
      submittedDate: now,
      applicationNumber: completedApplication.applicationNumber,
      relationshipStatus: defaultPayload.data.relationshipStatus,
      studentNumber: defaultPayload.data.studentNumber,
      programYear: { id: completedApplication.programYear.id },
      offeringIntensity: completedApplication.offeringIntensity,
      location: { id: completedApplication.location.id },
      parentApplication: { id: completedApplication.id },
      precedingApplication: { id: completedApplication.id },
      student: { id: student.id },
      applicationStatus: ApplicationStatus.Edited,
      applicationStatusUpdatedOn: now,
      applicationEditStatus: ApplicationEditStatus.ChangeInProgress,
      applicationEditStatusUpdatedOn: now,
      applicationEditStatusUpdatedBy: { id: student.user.id },
      currentAssessment: {
        id: expect.any(Number),
        studentAssessmentStatus: StudentAssessmentStatus.Submitted,
        studentAssessmentStatusUpdatedOn: now,
        offering: { id: completedApplication.currentAssessment.offering.id },
        studentAppeal: null,
        creator: { id: student.user.id },
        createdAt: now,
      },
    });
  });

  describe("Should throw an UnprocessableEntity exception when there is already an in-progress change request application", () => {
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

  it("Should throw an Unauthorized exception when the student does not have a valid SIN.", async () => {
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

  it("Should throw an UnprocessableEntity exception when a change request submission happens for a not allowed program year.", async () => {
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
