import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { ArrayOverlap, Repository } from "typeorm";
import { Announcement } from "@sims/sims-db";
import { addDays } from "@sims/utilities";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import { createFakeAnnouncement } from "@sims/test-utils/factories/announcement";

describe("AnnouncementInstitutionsController(e2e)-getAnnouncements", () => {
  let app: INestApplication;
  let announcementsRepo: Repository<Announcement>;
  const endpoint = `/institutions/announcements?target=institution-dashboard`;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    announcementsRepo = dataSource.getRepository(Announcement);
  });

  beforeEach(async () => {
    await announcementsRepo.delete({
      target: ArrayOverlap(["institution-dashboard"]),
    });
  });

  it("Should return a current announcement.", async () => {
    // Arrange
    const now = new Date();
    const before = addDays(-10, now);
    const future = addDays(30, now);

    const announcement = createFakeAnnouncement({
      initialValues: {
        startDate: before,
        endDate: future,
        target: ["institution-dashboard"],
      },
    });
    await announcementsRepo.save(announcement);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    expect(response.body.announcements).toStrictEqual([
      {
        messageTitle: announcement.messageTitle,
        message: announcement.message,
        startDate: announcement.startDate.toISOString(),
        endDate: announcement.endDate.toISOString(),
        target: announcement.target,
      },
    ]);
  });

  it("Should not return an outdated announcement.", async () => {
    // Arrange
    const now = new Date();
    const before = addDays(-20, now);

    const announcement = createFakeAnnouncement({
      initialValues: {
        startDate: before,
        endDate: before,
        target: ["institution-dashboard"],
      },
    });
    await announcementsRepo.save(announcement);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    expect(response.body.announcements).toStrictEqual([]);
  });

  it("Should not return a future announcement.", async () => {
    // Arrange
    const now = new Date();
    const future = addDays(90, now);

    const announcement = createFakeAnnouncement({
      initialValues: {
        startDate: future,
        endDate: future,
        target: ["institution-dashboard"],
      },
    });
    await announcementsRepo.save(announcement);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    expect(response.body.announcements).toStrictEqual([]);
  });

  afterAll(async () => {
    await app?.close();
  });
});
