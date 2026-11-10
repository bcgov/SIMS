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
  createFakeStudentRestriction,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  BatchRestriction,
  NoteType,
  Restriction,
  RestrictionNotificationType,
  RestrictionType,
  StudentRestriction,
  User,
} from "@sims/sims-db";
import { Role } from "../../../../auth";
import MockDate from "mockdate";

describe("BatchRestrictionAESTController(e2e)-createBatchRestriction", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let ministryUser: User;
  let provincialRestriction: Restriction;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const auditUser = await getAESTUser(
      dataSource,
      AESTGroups.BusinessAdministrators,
    );
    ministryUser = { id: auditUser.id } as User;
    // Find any provincial restriction that generates a notification when added.
    provincialRestriction = await db.restriction.findOne({
      select: { id: true },
      where: {
        restrictionType: RestrictionType.Provincial,
        notificationType: RestrictionNotificationType.Error,
      },
    });
  });

  beforeEach(() => {
    MockDate.reset();
  });

  it("Should create a batch restriction and add the restriction to each student when valid application numbers of different students are provided.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);

    const [application, otherApplication] = await Promise.all([
      saveFakeApplication(db.dataSource),
      saveFakeApplication(db.dataSource),
    ]);

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      restrictionId: provincialRestriction.id,
      applicationNumbers: [
        application.applicationNumber,
        otherApplication.applicationNumber,
      ],
      note: "Batch restriction test.",
    };

    // Act/Assert
    let batchRestrictionId: number;
    await request(app.getHttpServer())
      .post(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .send(payload)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        batchRestrictionId = response.body.id;
      });

    // Assert the student restriction and its note for each student.
    const expectedStudentRestriction = {
      id: expect.any(Number),
      isActive: true,
      restrictionNote: {
        id: expect.any(Number),
        description: payload.note,
        noteType: NoteType.Restriction,
      },
      creator: ministryUser,
      createdAt: now,
      updatedAt: now,
    };
    const studentRestrictions = await findActiveStudentRestrictions(
      application.student.id,
    );
    expect(studentRestrictions).toEqual([expectedStudentRestriction]);
    const otherStudentRestrictions = await findActiveStudentRestrictions(
      otherApplication.student.id,
    );
    expect(otherStudentRestrictions).toEqual([expectedStudentRestriction]);
    const [studentRestriction] = studentRestrictions;
    const [otherStudentRestriction] = otherStudentRestrictions;

    // Assert the batch restriction and that each application number is linked to its student restriction.
    const batchRestriction = await findBatchRestriction(batchRestrictionId);
    expect(batchRestriction).toEqual({
      id: batchRestrictionId,
      batchNumber: expect.any(Number),
      restriction: { id: provincialRestriction.id },
      creator: ministryUser,
      createdAt: now,
      updatedAt: now,
      batchRestrictionStudents: [
        {
          id: expect.any(Number),
          applicationNumber: application.applicationNumber,
          studentRestriction: { id: studentRestriction.id },
          failureReason: null,
          createdAt: now,
          creator: ministryUser,
          updatedAt: now,
        },
        {
          id: expect.any(Number),
          applicationNumber: otherApplication.applicationNumber,
          studentRestriction: { id: otherStudentRestriction.id },
          failureReason: null,
          createdAt: now,
          creator: ministryUser,
          updatedAt: now,
        },
      ],
    });

    // Assert the notification for the added restriction of each student.
    const notificationsExist = await Promise.all(
      [application.student.user.id, otherApplication.student.user.id].map(
        (studentUserId) =>
          db.notification.exists({ where: { user: { id: studentUserId } } }),
      ),
    );
    expect(notificationsExist).toEqual([true, true]);
  });

  it("Should add the restriction only once per student when application numbers belong to the same student or are repeated.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);

    const application = await saveFakeApplication(db.dataSource);
    const otherApplication = await saveFakeApplication(db.dataSource, {
      student: application.student,
    });

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      restrictionId: provincialRestriction.id,
      applicationNumbers: [
        application.applicationNumber,
        application.applicationNumber,
        otherApplication.applicationNumber,
      ],
      note: "Batch restriction test.",
    };

    // Act/Assert
    let batchRestrictionId: number;
    await request(app.getHttpServer())
      .post(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .send(payload)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        batchRestrictionId = response.body.id;
      });

    const studentRestrictions = await findActiveStudentRestrictions(
      application.student.id,
    );
    expect(studentRestrictions).toHaveLength(1);
    const [studentRestriction] = studentRestrictions;
    const batchRestriction = await findBatchRestriction(batchRestrictionId);
    expect(batchRestriction.batchRestrictionStudents).toEqual([
      {
        id: expect.any(Number),
        applicationNumber: application.applicationNumber,
        studentRestriction: { id: studentRestriction.id },
        failureReason: null,
        createdAt: now,
        creator: ministryUser,
        updatedAt: now,
      },
      {
        id: expect.any(Number),
        applicationNumber: otherApplication.applicationNumber,
        studentRestriction: { id: studentRestriction.id },
        failureReason: null,
        createdAt: now,
        creator: ministryUser,
        updatedAt: now,
      },
    ]);
  });

  it("Should link the application number to the most recent active restriction without adding it again when the student already has the restriction active.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);

    const application = await saveFakeApplication(db.dataSource);
    const [olderStudentRestriction, newerStudentRestriction] =
      await db.studentRestriction.save([
        createFakeStudentRestriction({
          student: application.student,
          restriction: provincialRestriction,
          creator: ministryUser,
        }),
        createFakeStudentRestriction({
          student: application.student,
          restriction: provincialRestriction,
          creator: ministryUser,
        }),
      ]);

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      restrictionId: provincialRestriction.id,
      applicationNumbers: [application.applicationNumber],
      note: "Batch restriction test.",
    };

    // Act/Assert
    let batchRestrictionId: number;
    await request(app.getHttpServer())
      .post(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .send(payload)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        batchRestrictionId = response.body.id;
      });

    const batchRestriction = await findBatchRestriction(batchRestrictionId);
    expect(batchRestriction.batchRestrictionStudents).toEqual([
      {
        id: expect.any(Number),
        applicationNumber: application.applicationNumber,
        studentRestriction: { id: newerStudentRestriction.id },
        failureReason: null,
        createdAt: now,
        creator: ministryUser,
        updatedAt: now,
      },
    ]);
    const studentRestrictions = await findActiveStudentRestrictions(
      application.student.id,
    );
    expect(studentRestrictions.map((restriction) => restriction.id)).toEqual([
      olderStudentRestriction.id,
      newerStudentRestriction.id,
    ]);
  });

  it("Should add the restriction again when the student has the restriction but it is not active.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);

    const application = await saveFakeApplication(db.dataSource);
    await db.studentRestriction.save(
      createFakeStudentRestriction(
        {
          student: application.student,
          restriction: provincialRestriction,
          creator: ministryUser,
        },
        { isActive: false },
      ),
    );

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      restrictionId: provincialRestriction.id,
      applicationNumbers: [application.applicationNumber],
      note: "Batch restriction test.",
    };

    // Act/Assert
    let batchRestrictionId: number;
    await request(app.getHttpServer())
      .post(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .send(payload)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        batchRestrictionId = response.body.id;
      });

    const studentRestrictions = await findActiveStudentRestrictions(
      application.student.id,
    );
    expect(studentRestrictions).toEqual([
      {
        id: expect.any(Number),
        isActive: true,
        restrictionNote: {
          id: expect.any(Number),
          description: payload.note,
          noteType: NoteType.Restriction,
        },
        creator: ministryUser,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const [studentRestriction] = studentRestrictions;
    // Assert the batch restriction student is associated with the added student restriction.
    const batchRestriction = await findBatchRestriction(batchRestrictionId);
    expect(batchRestriction.batchRestrictionStudents).toEqual([
      {
        id: expect.any(Number),
        applicationNumber: application.applicationNumber,
        studentRestriction: { id: studentRestriction.id },
        failureReason: null,
        createdAt: now,
        creator: ministryUser,
        updatedAt: now,
      },
    ]);
  });

  it("Should record a failure for the application number and still add the restriction to the other students when an application number does not exist.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);

    const application = await saveFakeApplication(db.dataSource);
    const notExistingApplicationNumber = "9999999999";

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      restrictionId: provincialRestriction.id,
      applicationNumbers: [
        notExistingApplicationNumber,
        application.applicationNumber,
      ],
      note: "Batch restriction test.",
    };

    // Act/Assert
    let batchRestrictionId: number;
    await request(app.getHttpServer())
      .post(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .send(payload)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        batchRestrictionId = response.body.id;
      });

    const [studentRestriction] = await findActiveStudentRestrictions(
      application.student.id,
    );
    const batchRestriction = await findBatchRestriction(batchRestrictionId);
    expect(batchRestriction.batchRestrictionStudents).toEqual([
      {
        id: expect.any(Number),
        applicationNumber: notExistingApplicationNumber,
        studentRestriction: null,
        failureReason: "The application number does not exist.",
        createdAt: now,
        creator: ministryUser,
        updatedAt: now,
      },
      {
        id: expect.any(Number),
        applicationNumber: application.applicationNumber,
        studentRestriction: { id: studentRestriction.id },
        failureReason: null,
        createdAt: now,
        creator: ministryUser,
        updatedAt: now,
      },
    ]);
  });

  it("Should return an unprocessable entity error when the restriction is not provincial.", async () => {
    // Arrange
    const federalRestriction = await db.restriction.findOne({
      select: { id: true },
      where: { restrictionType: RestrictionType.Federal },
    });

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      restrictionId: federalRestriction.id,
      applicationNumbers: ["1000000001"],
      note: "Batch restriction test.",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .send(payload)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "The given restriction type is not Provincial. Only provincial restrictions can be added.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should return an error when no application numbers are provided.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      restrictionId: provincialRestriction.id,
      applicationNumbers: [],
      note: "Batch restriction test.",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .send(payload)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: ["applicationNumbers should not be empty"],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should return an error when the application number is an invalid length.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      restrictionId: provincialRestriction.id,
      applicationNumbers: ["123"],
      note: "Batch restriction test.",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .send(payload)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: [
          "each value in applicationNumbers must be longer than or equal to 10 characters",
        ],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it(`Should return forbidden when the AEST user does not have the ${Role.AESTBatchRestriction} role.`, async () => {
    // Arrange
    const token = await getAESTToken();

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .send({
        restrictionId: provincialRestriction.id,
        applicationNumbers: ["1000000001"],
        note: "Batch restriction test.",
      })
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: "Forbidden resource",
        error: "Forbidden",
      });
  });

  /**
   * Helper function to find a batch restriction by its ID.
   * @param batchRestrictionId The ID of the batch restriction to find.
   * @returns The batch restriction entity corresponding to the given ID.
   */
  function findBatchRestriction(
    batchRestrictionId: number,
  ): Promise<BatchRestriction> {
    return db.batchRestriction.findOneOrFail({
      select: {
        id: true,
        batchNumber: true,
        restriction: { id: true },
        creator: { id: true },
        createdAt: true,
        updatedAt: true,
        batchRestrictionStudents: {
          id: true,
          applicationNumber: true,
          studentRestriction: { id: true },
          failureReason: true,
          createdAt: true,
          creator: { id: true },
          updatedAt: true,
        },
      },
      relations: {
        restriction: true,
        creator: true,
        batchRestrictionStudents: {
          studentRestriction: true,
          creator: true,
        },
      },
      where: { id: batchRestrictionId },
      // Batch restriction students are inserted in the order the application numbers were submitted.
      order: { batchRestrictionStudents: { id: "ASC" } },
    });
  }

  /**
   * Helper function to find the active student restrictions of the restriction used by the tests.
   * @param studentId The ID of the student.
   * @returns The active student restrictions, including the restriction note.
   */
  function findActiveStudentRestrictions(
    studentId: number,
  ): Promise<StudentRestriction[]> {
    return db.studentRestriction.find({
      select: {
        id: true,
        isActive: true,
        restrictionNote: { id: true, description: true, noteType: true },
        creator: { id: true },
        createdAt: true,
        updatedAt: true,
      },
      relations: { restrictionNote: true, creator: true },
      where: {
        student: { id: studentId },
        restriction: { id: provincialRestriction.id },
        isActive: true,
      },
      order: { id: "ASC" },
    });
  }

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Gets the endpoint for the batch restriction API.
 * @returns The endpoint URL for the batch restriction API.
 */
function getEndpoint(): string {
  return "/aest/batch-restriction";
}
