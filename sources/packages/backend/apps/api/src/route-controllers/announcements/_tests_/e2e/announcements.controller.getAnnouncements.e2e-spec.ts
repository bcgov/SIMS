import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { Repository } from "typeorm";
import { Announcements } from "@sims/sims-db";
import { createTestingAppModule } from "../../../../testHelpers";

describe("AnnouncementsController(e2e)-getAnnouncements", () => {
  let app: INestApplication;
  let announcementsRepo: Repository<Announcements>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    announcementsRepo = dataSource.getRepository(Announcements);
  });

  it("Should return a saved announcement.", async () => {
    // Arrange
    const announcement = new Announcements();
    announcement.message = "test announcement";
    announcement.messageTitle = "test title";
    announcement.target = "studentdashboard,";
    await announcementsRepo.save(announcement);
    const endpoint = `/announcements`;

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .expect(HttpStatus.OK);

    expect(
      response.body.some(
        (announcement) =>
          announcement.message === "test announcement" &&
          announcement.messageTitle == "test title" &&
          announcement.target == "studentdashboard,",
      ),
    ).toBe(true);
  });

  afterAll(async () => {
    await app?.close();
  });
});
