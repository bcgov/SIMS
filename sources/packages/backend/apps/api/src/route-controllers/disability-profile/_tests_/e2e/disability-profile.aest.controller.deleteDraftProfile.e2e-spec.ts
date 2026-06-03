import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeStudentDisabilityProfile,
} from "@sims/test-utils";
import { DisabilityProfileStatus, User } from "@sims/sims-db";

describe("DisabilityProfileAESTController(e2e)-deleteDraftProfile", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let ministryUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    ministryUser = await getAESTUser(
      dataSource,
      AESTGroups.BusinessAdministrators,
    );
  });

  it("Should delete a draft disability profile and set deletedAt when the profile exists.", async () => {
    // Arrange
    const draftProfile = await saveFakeStudentDisabilityProfile(db, {
      ministryUser,
      disabilityProfileStatus: DisabilityProfileStatus.Draft,
    });
    const endpoint = `/aest/disability-profile/${draftProfile.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .delete(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    const deletedDraftProfile = await db.studentDisabilityProfile.findOne({
      select: {
        id: true,
        deletedAt: true,
        modifier: {
          id: true,
        },
        updatedAt: true,
      },
      relations: {
        modifier: true,
      },
      where: {
        id: draftProfile.id,
      },
      loadEagerRelations: false,
      withDeleted: true,
    });
    expect(deletedDraftProfile).toEqual({
      id: draftProfile.id,
      deletedAt: expect.any(Date),
      modifier: {
        id: ministryUser.id,
      },
      updatedAt: expect.any(Date),
    });
  });

  it("Should throw an unprocessable entity error when trying to delete an active disability profile.", async () => {
    // Arrange
    const draftProfile = await saveFakeStudentDisabilityProfile(db, {
      ministryUser,
      disabilityProfileStatus: DisabilityProfileStatus.Active,
    });
    const endpoint = `/aest/disability-profile/${draftProfile.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .delete(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: `Draft disability profile ID ${draftProfile.id} not found.`,
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it("Should throw a not found error when the draft disability profile does not exist.", async () => {
    // Arrange
    const nonExistentDisabilityProfileId = 99999;
    const endpoint = `/aest/disability-profile/${nonExistentDisabilityProfileId}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .delete(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Draft disability profile ID ${nonExistentDisabilityProfileId} not found.`,
        error: "Not Found",
      });
  });

  it("Should throw a forbidden error when the user does not have permission.", async () => {
    // Arrange
    const endpoint = "/aest/disability-profile/99999";
    const token = await getAESTToken(AESTGroups.Operations);

    // Act/Assert
    await request(app.getHttpServer())
      .delete(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message: "Forbidden resource",
        error: "Forbidden",
        statusCode: HttpStatus.FORBIDDEN,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
