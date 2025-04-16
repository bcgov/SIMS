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

  describe("Should cancel a change request when change request is still considered 'in-progress'", () => {
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
        const endpoint = `/students/application/${completedApplication.id}/cancel-change-request`;
        const token = await getStudentToken(
          FakeStudentUsersTypes.FakeStudentUserType1,
        );
        await mockUserLoginInfo(appModule, completedApplication.student);

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
        // TODO: improve assertions.
        expect(cancelledChangeRequestApplication).toEqual({
          id: completedApplication.id,
          applicationEditStatus: ApplicationEditStatus.ChangeCancelled,
          applicationEditStatusUpdatedOn: expect.any(Date),
          applicationEditStatusUpdatedBy: expect.objectContaining({
            id: expect.any(Number),
          }),
          modifier: expect.objectContaining({ id: expect.any(Number) }),
          updatedAt: expect.any(Date),
          currentAssessment: expect.objectContaining({
            id: completedApplication.currentAssessment.id,
            studentAssessmentStatus:
              StudentAssessmentStatus.CancellationRequested,
            studentAssessmentStatusUpdatedOn: expect.any(Date),
            modifier: expect.objectContaining({ id: expect.any(Number) }),
            updatedAt: expect.any(Date),
          }),
        });
      });
    });
  });

  afterAll(async () => {
    await app?.close();
  });
});
