import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeBatchRestriction,
  createFakeBatchRestrictionStudent,
  createFakeRestriction,
  createFakeStudentRestriction,
  createFakeUser,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { Role } from "../../../../auth";
import { BatchRestriction, Restriction, Student, User } from "@sims/sims-db";
import { BatchRestrictionStudentResult } from "../../../../services";

const APPLICATION_NOT_FOUND_REASON = "The application number does not exist.";

describe("BatchRestrictionAESTController(e2e)-getBatchRestrictionStudents", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let auditUser: User;
  let restriction: Restriction;
  let batch: BatchRestriction;
  let studentOne: Student;
  let studentTwo: Student;
  // Student one has two application numbers and student two has one.
  const studentOneApplicationNumbers = ["9900000001", "9900000002"];
  const studentTwoApplicationNumber = "9900000003";
  const failedApplicationNumber = "9999999999";

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    auditUser = await db.user.save(createFakeUser());
    restriction = await db.restriction.save(createFakeRestriction());
    [studentOne, studentTwo] = await Promise.all([
      saveFakeStudent(db.dataSource),
      saveFakeStudent(db.dataSource),
    ]);
    const [studentOneRestriction, studentTwoRestriction] = await Promise.all([
      db.studentRestriction.save(
        createFakeStudentRestriction({
          student: studentOne,
          restriction,
          creator: auditUser,
        }),
      ),
      db.studentRestriction.save(
        createFakeStudentRestriction({
          student: studentTwo,
          restriction,
          creator: auditUser,
        }),
      ),
    ]);
    // Batch with two successful application numbers for student one,
    // one successful application number for student two, and one failed application number.
    batch = await db.batchRestriction.save(
      createFakeBatchRestriction({ restriction, creator: auditUser }),
    );
    // The application numbers are saved out of order to ensure the endpoint orders them by application number.
    await db.batchRestrictionStudent.save([
      createFakeBatchRestrictionStudent(
        {
          batchRestriction: batch,
          applicationNumber: failedApplicationNumber,
          creator: auditUser,
        },
        { initialValues: { failureReason: APPLICATION_NOT_FOUND_REASON } },
      ),
      createFakeBatchRestrictionStudent({
        batchRestriction: batch,
        applicationNumber: studentTwoApplicationNumber,
        studentRestriction: studentTwoRestriction,
        creator: auditUser,
      }),
      ...studentOneApplicationNumbers.toReversed().map((applicationNumber) =>
        createFakeBatchRestrictionStudent({
          batchRestriction: batch,
          applicationNumber,
          studentRestriction: studentOneRestriction,
          creator: auditUser,
        }),
      ),
    ]);
  });

  it("Should return all application numbers of the batch ordered by application number when no filter options are provided.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(
        getEndpoint({
          batchRestrictionId: batch.id,
          queryString: "page=0&pageLimit=10",
        }),
      )
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          ...studentOneApplicationNumbers.map((applicationNumber) => ({
            applicationNumber,
            studentId: studentOne.id,
            result: BatchRestrictionStudentResult.Successful,
            failureReason: null,
          })),
          {
            applicationNumber: studentTwoApplicationNumber,
            studentId: studentTwo.id,
            result: BatchRestrictionStudentResult.Successful,
            failureReason: null,
          },
          {
            applicationNumber: failedApplicationNumber,
            result: BatchRestrictionStudentResult.Failed,
            failureReason: APPLICATION_NOT_FOUND_REASON,
          },
        ],
        count: 4,
      });
  });

  it("Should return the second page of application numbers when the page limit is two and there are four application numbers in the batch.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(
        getEndpoint({
          batchRestrictionId: batch.id,
          queryString: "page=1&pageLimit=2",
        }),
      )
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            applicationNumber: studentTwoApplicationNumber,
            studentId: studentTwo.id,
            result: BatchRestrictionStudentResult.Successful,
            failureReason: null,
          },
          {
            applicationNumber: failedApplicationNumber,
            result: BatchRestrictionStudentResult.Failed,
            failureReason: APPLICATION_NOT_FOUND_REASON,
          },
        ],
        count: 4,
      });
  });

  it("Should return only the application numbers partially matching the search criteria when the search criteria is provided.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(
        getEndpoint({
          batchRestrictionId: batch.id,
          queryString: "page=0&pageLimit=10&searchCriteria=990000",
        }),
      )
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          ...studentOneApplicationNumbers.map((applicationNumber) => ({
            applicationNumber,
            studentId: studentOne.id,
            result: BatchRestrictionStudentResult.Successful,
            failureReason: null,
          })),
          {
            applicationNumber: studentTwoApplicationNumber,
            studentId: studentTwo.id,
            result: BatchRestrictionStudentResult.Successful,
            failureReason: null,
          },
        ],
        count: 3,
      });
  });

  it("Should return only the successful application numbers when the result filter is Successful.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(
        getEndpoint({
          batchRestrictionId: batch.id,
          queryString: `page=0&pageLimit=10&result=${BatchRestrictionStudentResult.Successful}`,
        }),
      )
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          ...studentOneApplicationNumbers.map((applicationNumber) => ({
            applicationNumber,
            studentId: studentOne.id,
            result: BatchRestrictionStudentResult.Successful,
            failureReason: null,
          })),
          {
            applicationNumber: studentTwoApplicationNumber,
            studentId: studentTwo.id,
            result: BatchRestrictionStudentResult.Successful,
            failureReason: null,
          },
        ],
        count: 3,
      });
  });

  it("Should return only the failed application numbers when the result filter is Failed.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(
        getEndpoint({
          batchRestrictionId: batch.id,
          queryString: `page=0&pageLimit=10&result=${BatchRestrictionStudentResult.Failed}`,
        }),
      )
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            applicationNumber: failedApplicationNumber,
            result: BatchRestrictionStudentResult.Failed,
            failureReason: APPLICATION_NOT_FOUND_REASON,
          },
        ],
        count: 1,
      });
  });

  it("Should return the student of a successful application number when the student restriction was deleted after the batch was submitted.", async () => {
    // Arrange
    const deletedRestrictionStudent = await saveFakeStudent(db.dataSource);
    const deletedStudentRestriction = await db.studentRestriction.save(
      createFakeStudentRestriction(
        {
          student: deletedRestrictionStudent,
          restriction,
          creator: auditUser,
        },
        { isActive: false, deletedAt: new Date() },
      ),
    );
    const deletedRestrictionBatch = await db.batchRestriction.save(
      createFakeBatchRestriction({ restriction, creator: auditUser }),
    );
    const deletedRestrictionApplicationNumber = "9900000004";
    await db.batchRestrictionStudent.save(
      createFakeBatchRestrictionStudent({
        batchRestriction: deletedRestrictionBatch,
        applicationNumber: deletedRestrictionApplicationNumber,
        studentRestriction: deletedStudentRestriction,
        creator: auditUser,
      }),
    );
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(
        getEndpoint({
          batchRestrictionId: deletedRestrictionBatch.id,
          queryString: "page=0&pageLimit=10",
        }),
      )
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            applicationNumber: deletedRestrictionApplicationNumber,
            studentId: deletedRestrictionStudent.id,
            result: BatchRestrictionStudentResult.Successful,
            failureReason: null,
          },
        ],
        count: 1,
      });
  });

  it("Should throw a HttpStatus Not Found (404) error when the batch restriction does not exist.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(
        getEndpoint({
          batchRestrictionId: 99999999,
          queryString: "page=0&pageLimit=10",
        }),
      )
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Batch restriction with ID 99999999 not found.",
        error: "Not Found",
      });
  });

  it("Should throw a HttpStatus Bad Request (400) error when the result filter is invalid.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(
        getEndpoint({
          batchRestrictionId: batch.id,
          queryString: "page=0&pageLimit=10&result=SomeInvalidResult",
        }),
      )
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: [
          "result must be one of the following values: Successful, Failed",
        ],
        error: "Bad Request",
      });
  });

  it(`Should throw a HttpStatus Forbidden (403) error when the AEST user does not have the ${Role.AESTBatchRestriction} role.`, async () => {
    // Arrange
    const token = await getAESTToken();

    // Act/Assert
    await request(app.getHttpServer())
      .get(
        getEndpoint({
          batchRestrictionId: 1,
          queryString: "page=0&pageLimit=10",
        }),
      )
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: "Forbidden resource",
        error: "Forbidden",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Gets the endpoint for the students of a batch restriction for AEST users.
 * @param options endpoint options.
 * - `batchRestrictionId` batch restriction ID.
 * - `queryString` pagination query string.
 * @returns the endpoint for the students of a batch restriction.
 */
function getEndpoint(options: {
  batchRestrictionId: number;
  queryString: string;
}): string {
  return `/aest/batch-restriction/${options.batchRestrictionId}/students?${options.queryString}`;
}
