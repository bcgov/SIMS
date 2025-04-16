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
} from "@sims/test-utils";
import {
  APPLICATION_EDIT_STATUS_IN_PROGRESS_VALUES,
  ApplicationEditStatus,
  ApplicationStatus,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import MockDate from "mockdate";

describe("ApplicationStudentsController(e2e)-applicationCancelChangeRequest", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
  });

  beforeEach(async () => {
    MockDate.reset();
  });

  describe("Should cancel a change request when the change request is still considered 'in-progress'", () => {
    APPLICATION_EDIT_STATUS_IN_PROGRESS_VALUES.forEach((status) => {
      it(`with an edit status defined as '${status}'.`, async () => {
        // Arrange
        const completedApplication = await saveFakeApplication(
          db.dataSource,
          undefined,
          {
            applicationStatus: ApplicationStatus.Edited,
            applicationEditStatus: status,
          },
        );
        const student = completedApplication.student;
        const endpoint = `/students/application/${completedApplication.id}/cancel-change-request`;
        const token = await getStudentToken(
          FakeStudentUsersTypes.FakeStudentUserType1,
        );
        await mockUserLoginInfo(appModule, student);
        const now = new Date();
        MockDate.set(now);

        // Act/Assert
        await request(app.getHttpServer())
          .patch(endpoint)
          .auth(token, BEARER_AUTH_TYPE)
          .expect(HttpStatus.OK);

        const cancelledChangeRequestApplication = await db.application.findOne({
          select: {
            id: true,
            applicationEditStatus: true,
            applicationEditStatusUpdatedOn: true,
            applicationEditStatusUpdatedBy: { id: true },
            modifier: { id: true },
            updatedAt: true,
            currentAssessment: {
              id: true,
              studentAssessmentStatus: true,
              studentAssessmentStatusUpdatedOn: true,
              modifier: { id: true },
              updatedAt: true,
            },
          },
          relations: {
            applicationEditStatusUpdatedBy: true,
            modifier: true,
            currentAssessment: {
              offering: true,
              studentAppeal: true,
              modifier: true,
            },
          },
          where: {
            id: completedApplication.id,
          },
          loadEagerRelations: false,
        });
        // Expected user object.
        const expectedUserObject = expect.objectContaining({
          id: student.user.id,
        });
        // Expected updated fields.
        expect(cancelledChangeRequestApplication).toEqual({
          id: completedApplication.id,
          applicationEditStatus: ApplicationEditStatus.ChangeCancelled,
          applicationEditStatusUpdatedOn: now,
          applicationEditStatusUpdatedBy: expectedUserObject,
          modifier: expectedUserObject,
          updatedAt: now,
          currentAssessment: expect.objectContaining({
            id: completedApplication.currentAssessment.id,
            studentAssessmentStatus:
              StudentAssessmentStatus.CancellationRequested,
            studentAssessmentStatusUpdatedOn: now,
            modifier: expectedUserObject,
            updatedAt: now,
          }),
        });
      });
    });
  });

  it("Should throw a NotFoundException when the application has already been declined by the Ministry.", async () => {
    // Arrange
    const completedApplication = await saveFakeApplication(
      db.dataSource,
      undefined,
      {
        applicationStatus: ApplicationStatus.Edited,
        applicationEditStatus: ApplicationEditStatus.ChangeDeclined,
      },
    );
    const endpoint = `/students/application/${completedApplication.id}/cancel-change-request`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    await mockUserLoginInfo(appModule, completedApplication.student);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Not able to find the in-progress change request.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it("Should throw a NotFoundException when the application does not belong to the student.", async () => {
    // Arrange
    const completedApplication = await saveFakeApplication(
      db.dataSource,
      undefined,
      {
        applicationStatus: ApplicationStatus.Edited,
        applicationEditStatus: ApplicationEditStatus.ChangeInProgress,
      },
    );
    const endpoint = `/students/application/${completedApplication.id}/cancel-change-request`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Not able to find the in-progress change request.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it("Should throw a NotFoundException when the application does not exist.", async () => {
    // Arrange
    const endpoint = `/students/application/9999999/cancel-change-request`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Not able to find the in-progress change request.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
