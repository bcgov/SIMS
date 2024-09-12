import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { Repository } from "typeorm";
import { Announcement, MSFAANumber, Student } from "@sims/sims-db";
import { addDays } from "@sims/utilities";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockUserLoginInfo,
} from "../../../../testHelpers";
import { TestingModule } from "@nestjs/testing";
import {
  createE2EDataSources,
  createFakeMSFAANumber,
  E2EDataSources,
  MSFAAStates,
  saveFakeStudent,
} from "@sims/test-utils";

describe("AnnouncementStudentsController(e2e)-getAnnouncements", () => {
  let app: INestApplication;
  let announcementsRepo: Repository<Announcement>;
  let appModule: TestingModule;
  let sharedStudent: Student;
  let sharedSignedMSFAANumber: MSFAANumber;
  let db: E2EDataSources;
  const endpoint = `/students/announcements?target=student-dashboard`;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    announcementsRepo = dataSource.getRepository(Announcement);
    appModule = module;
    db = createE2EDataSources(dataSource);
    // Create a student with valid SIN and valid MSFAA number.
    sharedStudent = await saveFakeStudent(db.dataSource);
    sharedSignedMSFAANumber = createFakeMSFAANumber(
      { student: sharedStudent },
      {
        msfaaState: MSFAAStates.Signed,
      },
    );
    await db.msfaaNumber.save(sharedSignedMSFAANumber);
  });

  beforeEach(async () => {
    await mockUserLoginInfo(appModule, sharedStudent);
  });

  it("Should return a current announcement.", async () => {
    // Arrange
    const now = new Date();
    const before = addDays(-10, now);
    const future = addDays(30, now);

    const announcement = new Announcement();
    announcement.message = "test announcement";
    announcement.messageTitle = "test title";
    announcement.target = ["student-dashboard", "institution-dashboard"];
    announcement.startDate = before;
    announcement.endDate = future;
    await announcementsRepo.save(announcement);
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    expect(
      response.body.some(
        (announcement) =>
          announcement.message === "test announcement" &&
          announcement.messageTitle === "test title",
      ),
    ).toBe(true);
  });

  it("Should not return an outdated announcement.", async () => {
    // Arrange
    const now = new Date();
    const before = addDays(-20, now);

    const announcement = new Announcement();
    announcement.message = "already done";
    announcement.messageTitle = "already done";
    announcement.target = ["student-dashboard", "institution-dashboard"];
    announcement.startDate = before;
    announcement.endDate = before;
    await announcementsRepo.save(announcement);
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    expect(
      response.body.some(
        (announcement) =>
          announcement.message === "already done" &&
          announcement.messageTitle === "already done",
      ),
    ).toBe(false);
  });

  it("Should not return a future announcement.", async () => {
    // Arrange
    const now = new Date();
    const future = addDays(90, now);

    const announcement = new Announcement();
    announcement.message = "far off future announcement test";
    announcement.messageTitle = "far off future announcement test";
    announcement.target = ["student-dashboard", "institution-dashboard"];
    announcement.startDate = future;
    announcement.endDate = future;
    await announcementsRepo.save(announcement);
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    expect(
      response.body.some(
        (announcement) =>
          announcement.message === "far off future announcement test" &&
          announcement.messageTitle === "far off future announcement test",
      ),
    ).toBe(false);
  });

  afterAll(async () => {
    await app?.close();
  });
});
