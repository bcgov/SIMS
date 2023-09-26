import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudent,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import * as request from "supertest";
import { RestrictionNotificationType, RestrictionType } from "@sims/sims-db";

describe("RestrictionAESTController(e2e)-addStudentProvincialRestriction.", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it(`Should add a provincial restriction and generate a notification when the restriction notification type is different than '${RestrictionNotificationType.NoEffect}'.`, async () => {
    // Arrange
    const student = await db.student.save(createFakeStudent());
    const endpoint = `/aest/restriction/student/${student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Find any notification defined to be shown as an error.
    const provincialErrorRestriction = await db.restriction.findOne({
      select: { id: true },
      where: {
        restrictionType: RestrictionType.Provincial,
        notificationType: RestrictionNotificationType.Error,
      },
    });

    // Act
    await request(app.getHttpServer())
      .post(endpoint)
      .send({
        restrictionId: provincialErrorRestriction.id,
        noteDescription: "E2E add provincial restriction.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect(({ body }) => {
        expect(body).toHaveProperty("id");
        expect(body.id).toBeGreaterThan(0);
      });

    // Assert
    const createdNotification = await db.notification.findOne({
      select: { id: true, messagePayload: true },
      where: { user: { id: student.user.id } },
    });
    expect(createdNotification.messagePayload).toStrictEqual({
      template_id: "2b64245f-770c-4493-9d3c-4e0f86773987",
      email_address: student.user.email,
      personalisation: {
        date: expect.any(String),
        lastName: student.user.lastName,
        givenNames: student.user.firstName,
      },
    });
  });

  it(`Should add a provincial restriction and not generate a notification when the restriction notification type is '${RestrictionNotificationType.NoEffect}'.`, async () => {
    // Arrange
    const student = await db.student.save(createFakeStudent());
    const endpoint = `/aest/restriction/student/${student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Find any notification defined to not be shown.
    const provincialNoEffectRestriction = await db.restriction.findOne({
      select: { id: true },
      where: {
        restrictionType: RestrictionType.Provincial,
        notificationType: RestrictionNotificationType.NoEffect,
      },
    });

    // Act
    await request(app.getHttpServer())
      .post(endpoint)
      .send({
        restrictionId: provincialNoEffectRestriction.id,
        noteDescription: "E2E add provincial restriction.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect(({ body }) => {
        expect(body).toHaveProperty("id");
        expect(body.id).toBeGreaterThan(0);
      });

    // Assert
    const existsNotification = await db.notification.exist({
      where: { user: { id: student.user.id } },
    });
    expect(existsNotification).toBeFalsy();
  });

  afterAll(async () => {
    await app?.close();
  });
});
