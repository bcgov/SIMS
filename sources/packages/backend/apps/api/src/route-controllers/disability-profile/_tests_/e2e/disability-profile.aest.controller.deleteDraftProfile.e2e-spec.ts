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

    // Act
    await request(app.getHttpServer())
      .delete(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Assert
    const deletedDraftProfile = await db.studentDisabilityProfile.findOne({
      select: {
        id: true,
        deletedAt: true,
      },
      where: {
        id: draftProfile.id,
      },
      withDeleted: true,
    });
    expect(deletedDraftProfile).toEqual({
      id: draftProfile.id,
      deletedAt: expect.any(Date),
    });
  });

  it("Should throw NotFoundException when the draft disability profile does not exist.", async () => {
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

  afterAll(async () => {
    await app?.close();
  });
});
