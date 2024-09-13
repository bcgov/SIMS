import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { Repository } from "typeorm";
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

  it("Should return a current announcement.", async () => {
    // Arrange
    const now = new Date();
    const before = addDays(-10, now);
    const future = addDays(30, now);

    const announcement = createFakeAnnouncement(before, future);
    await announcementsRepo.save(announcement);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    expect(
      response.body.announcements.some(
        (responseAnnouncement) =>
          responseAnnouncement.message === announcement.message &&
          responseAnnouncement.messageTitle === announcement.messageTitle &&
          responseAnnouncement.startDate ===
            new Date(announcement.startDate).toISOString() &&
          responseAnnouncement.endDate ===
            new Date(announcement.endDate).toISOString(),
      ),
    ).toBe(true);
  });

  it("Should not return an outdated announcement.", async () => {
    // Arrange
    const now = new Date();
    const before = addDays(-20, now);

    const announcement = createFakeAnnouncement(before, before);
    await announcementsRepo.save(announcement);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    expect(
      response.body.announcements.some(
        (responseAnnouncement) =>
          responseAnnouncement.message === announcement.message &&
          responseAnnouncement.messageTitle === announcement.messageTitle &&
          responseAnnouncement.startDate ===
            new Date(announcement.startDate).toISOString() &&
          responseAnnouncement.endDate ===
            new Date(announcement.endDate).toISOString(),
      ),
    ).toBe(false);
  });

  it("Should not return a future announcement.", async () => {
    // Arrange
    const now = new Date();
    const future = addDays(90, now);

    const announcement = createFakeAnnouncement(future, future);
    await announcementsRepo.save(announcement);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    expect(
      response.body.announcements.some(
        (responseAnnouncement) =>
          responseAnnouncement.message === announcement.message &&
          responseAnnouncement.messageTitle === announcement.messageTitle &&
          responseAnnouncement.startDate ===
            new Date(announcement.startDate).toISOString() &&
          responseAnnouncement.endDate ===
            new Date(announcement.endDate).toISOString(),
      ),
    ).toBe(false);
  });

  afterAll(async () => {
    await app?.close();
  });
});
