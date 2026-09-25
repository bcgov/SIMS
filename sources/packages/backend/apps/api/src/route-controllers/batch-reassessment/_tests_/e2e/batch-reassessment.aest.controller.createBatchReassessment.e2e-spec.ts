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
  saveFakeApplication,
} from "@sims/test-utils";
import {
  AssessmentTriggerType,
  BatchReassessment,
  NoteType,
  StudentAssessmentStatus,
  User,
} from "@sims/sims-db";
import { Role } from "../../../../auth";
import MockDate from "mockdate";

describe("BatchReassessmentAESTController(e2e)-createBatchReassessment", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let ministryUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const auditUser = await getAESTUser(
      dataSource,
      AESTGroups.BusinessAdministrators,
    );
    ministryUser = { id: auditUser.id } as User;
  });

  beforeEach(async () => {
    MockDate.reset();
  });

  it("Should create a batch reassessment and associated entities when a valid application number is provided.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);

    const application = await saveFakeApplication(
      db.dataSource,
      {},
      {
        currentAssessmentInitialValues: {
          assessmentDate: now,
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
        },
      },
    );

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      applicationNumbers: [application.applicationNumber],
      note: "Batch reassessment test.",
    };

    // Act/Assert
    let batchReassessmentId;
    await request(app.getHttpServer())
      .post(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .send(payload)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        batchReassessmentId = response.body.id;
      });

    const batchReassessment = await findBatchReassessment(batchReassessmentId);

    // Assert the Batch Reassessment and related entities.
    expect(batchReassessment).toEqual({
      id: batchReassessmentId,
      batchNumber: expect.any(Number),
      creator: ministryUser,
      createdAt: now,
      updatedAt: now,
      batchReassessmentApplications: [
        {
          id: expect.any(Number),
          applicationNumber: application.applicationNumber,
          studentAssessment: {
            id: expect.any(Number),
            triggerType: AssessmentTriggerType.ManualReassessment,
            studentAssessmentStatus: StudentAssessmentStatus.Submitted,
          },
          failureReason: null,
          createdAt: now,
          creator: ministryUser,
          updatedAt: now,
        },
      ],
    });

    // Assert the Student Notes.
    const student = await db.student.findOne({
      select: { notes: true },
      relations: { notes: true },
      where: { id: application.student.id },
    });
    expect(student.notes).toEqual([
      {
        id: expect.any(Number),
        description: payload.note,
        noteType: NoteType.Application,
        updatedAt: expect.any(Date),
        createdAt: expect.any(Date),
      },
    ]);
  });

  it("Should create a batch reassessment with a single batch reassessment application when duplicate application numbers are provided.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);

    const invalidApplicationNumber = "1212343456";

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      applicationNumbers: [invalidApplicationNumber, invalidApplicationNumber],
      note: "Batch reassessment test.",
    };

    // Act/Assert
    let batchReassessmentId;
    await request(app.getHttpServer())
      .post(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .send(payload)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        batchReassessmentId = response.body.id;
      });

    const batchReassessment = await findBatchReassessment(batchReassessmentId);

    expect(batchReassessment).toEqual({
      id: batchReassessmentId,
      batchNumber: expect.any(Number),
      creator: ministryUser,
      createdAt: now,
      updatedAt: now,
      batchReassessmentApplications: [
        {
          id: expect.any(Number),
          applicationNumber: invalidApplicationNumber,
          studentAssessment: null,
          failureReason: "Application not found",
          createdAt: now,
          creator: ministryUser,
          updatedAt: now,
        },
      ],
    });
  });

  it("Should create a batch reassessment with failure when an archived application is provided.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);

    const application = await saveFakeApplication(
      db.dataSource,
      {},
      { initialValues: { isArchived: true } },
    );

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      applicationNumbers: [application.applicationNumber],
      note: "Batch reassessment test.",
    };

    // Act/Assert
    let batchReassessmentId;
    await request(app.getHttpServer())
      .post(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .send(payload)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        batchReassessmentId = response.body.id;
      });

    const batchReassessment = await findBatchReassessment(batchReassessmentId);

    expect(batchReassessment).toEqual({
      id: batchReassessmentId,
      batchNumber: expect.any(Number),
      creator: ministryUser,
      createdAt: now,
      updatedAt: now,
      batchReassessmentApplications: [
        {
          id: expect.any(Number),
          applicationNumber: application.applicationNumber,
          studentAssessment: null,
          failureReason:
            "Application cannot have manual reassessment after being archived.",
          createdAt: now,
          creator: ministryUser,
          updatedAt: now,
        },
      ],
    });
  });

  it("Should create a batch reassessment with failure when the original assessment isn't complete.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);

    const application = await saveFakeApplication(db.dataSource);

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      applicationNumbers: [application.applicationNumber],
      note: "Batch reassessment test.",
    };

    // Act/Assert
    let batchReassessmentId;
    await request(app.getHttpServer())
      .post(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .send(payload)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        batchReassessmentId = response.body.id;
      });

    const batchReassessment = await findBatchReassessment(batchReassessmentId);

    expect(batchReassessment).toEqual({
      id: batchReassessmentId,
      batchNumber: expect.any(Number),
      creator: ministryUser,
      createdAt: now,
      updatedAt: now,
      batchReassessmentApplications: [
        {
          id: expect.any(Number),
          applicationNumber: application.applicationNumber,
          studentAssessment: null,
          failureReason:
            "Application original assessment expected to be 'Completed' to allow manual reassessment.",
          createdAt: now,
          creator: ministryUser,
          updatedAt: now,
        },
      ],
    });
  });

  it.only("Should return an error when no application numbers are provided.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      applicationNumbers: [],
      note: "Batch reassessment test.",
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

  it.only("Should return an error when the application number is an invalid length.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      applicationNumbers: ["123"],
      note: "Batch reassessment test.",
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

  it(`Should return forbidden when the AEST user does not have the ${Role.AESTBatchReassessment} role.`, async () => {
    // Arrange
    const token = await getAESTToken();

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .send({
        applicationNumbers: ["1000000001"],
        note: "Batch reassessment test.",
      })
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: "Forbidden resource",
        error: "Forbidden",
      });
  });

  /**
   * Helper function to find a batch reassessment by its ID.
   * @param batchReassessmentId
   * @returns
   */
  async function findBatchReassessment(
    batchReassessmentId: number,
  ): Promise<BatchReassessment> {
    return await db.batchReassessment.findOneOrFail({
      select: {
        id: true,
        batchNumber: true,
        creator: {
          id: true,
        },
        createdAt: true,
        updatedAt: true,
        batchReassessmentApplications: {
          id: true,
          applicationNumber: true,
          studentAssessment: {
            id: true,
            triggerType: true,
            studentAssessmentStatus: true,
          },
          failureReason: true,
          createdAt: true,
          creator: {
            id: true,
          },
          updatedAt: true,
        },
      },
      relations: {
        creator: true,
        batchReassessmentApplications: {
          creator: true,
          studentAssessment: true,
        },
      },
      where: { id: batchReassessmentId },
    });
  }

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Gets the endpoint for batch reassessment API.
 * @returns The endpoint URL for the batch reassessment API.
 */
function getEndpoint(): string {
  return "/aest/batch-reassessment";
}
