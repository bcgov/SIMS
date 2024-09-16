import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { ArrayOverlap, Repository } from "typeorm";
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
import { createFakeAnnouncement } from "@sims/test-utils/factories/announcement";

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

    await announcementsRepo.delete({
      target: ArrayOverlap(["student-dashboard"]),
    });
  });

  it("Should return a current announcement.", async () => {
    // Arrange
    const now = new Date();
    const before = addDays(-10, now);
    const future = addDays(30, now);

    const announcement = createFakeAnnouncement({
      initialValues: { startDate: before, endDate: future },
    });
    await announcementsRepo.save(announcement);
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
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
      initialValues: { startDate: before, endDate: before },
    });
    await announcementsRepo.save(announcement);
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    expect(response.body.announcements).toStrictEqual([]);
  });

  it("Should not return a future announcement.", async () => {
    // Arrange
    const now = new Date();
    const future = addDays(90, now);

    const announcement = createFakeAnnouncement({
      initialValues: { startDate: future, endDate: future },
    });
    await announcementsRepo.save(announcement);
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    expect(response.body.announcements).toStrictEqual([]);
  });

  afterAll(async () => {
    await app?.close();
  });
});
