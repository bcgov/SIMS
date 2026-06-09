import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
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
  saveFakeStudent,
  saveFakeStudentDisabilityProfile,
} from "@sims/test-utils";
import { DisabilityProfileStatus, User } from "@sims/sims-db";
import { addDays } from "@sims/utilities";
import { createExpectedProfile } from "./disability-profile-utils";

describe("DisabilityProfileAESTController(e2e)-getStudentDisabilityProfiles", () => {
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

  it("Should get an active, a draft, and two ordered archived profiles when the student has all types of disability profiles.", async () => {
    // Arrange
    const now = new Date();
    const student = await saveFakeStudent(db.dataSource);
    const [active, draft, archivedNewest, archivedOldest] = await Promise.all(
      [
        DisabilityProfileStatus.Active,
        DisabilityProfileStatus.Draft,
        DisabilityProfileStatus.Archived,
        DisabilityProfileStatus.Archived,
      ].map((disabilityProfileStatus, index) =>
        saveFakeStudentDisabilityProfile(db, {
          ministryUser,
          student,
          disabilityProfileStatus,
          now: addDays(index * -1, now),
        }),
      ),
    );
    const endpoint = `/aest/disability-profile/student/${student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual({
          profiles: [
            createExpectedProfile(draft),
            createExpectedProfile(active),
            createExpectedProfile(archivedNewest),
            createExpectedProfile(archivedOldest),
          ],
        }),
      );
  });

  it("Should get an empty disability profiles list when the student has no profiles.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const endpoint = `/aest/disability-profile/student/${student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({ profiles: [] });
  });

  it("Should throw a forbidden error when the user does not have permission.", async () => {
    // Arrange
    const endpoint = "/aest/disability-profile/student/999999";
    const token = await getAESTToken(AESTGroups.Operations);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
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
