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
import { BatchRestriction, Student } from "@sims/sims-db";
import { BatchRestrictionStudentResult } from "../../../../services";

const APPLICATION_NOT_FOUND_REASON = "The application number does not exist.";

describe("BatchRestrictionAESTController(e2e)-getBatchRestrictionStudents", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let batch: BatchRestriction;
  let student: Student;
  const successfulApplicationNumbers = ["9900000001", "9900000002"];
  const failedApplicationNumber = "9999999999";

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const auditUser = await db.user.save(createFakeUser());
    const restriction = await db.restriction.save(createFakeRestriction());
    student = await saveFakeStudent(db.dataSource);
    const studentRestriction = await db.studentRestriction.save(
      createFakeStudentRestriction({
        student,
        restriction,
        creator: auditUser,
      }),
    );
    // Batch with two successful application numbers of the same student
    // and one failed application number.
    batch = await db.batchRestriction.save(
      createFakeBatchRestriction({ restriction, creator: auditUser }),
    );
    await db.batchRestrictionStudent.save([
      ...successfulApplicationNumbers.map((applicationNumber) =>
        createFakeBatchRestrictionStudent({
          batchRestriction: batch,
          applicationNumber,
          studentRestriction,
          creator: auditUser,
        }),
      ),
      createFakeBatchRestrictionStudent(
        {
          batchRestriction: batch,
          applicationNumber: failedApplicationNumber,
          creator: auditUser,
        },
        { initialValues: { failureReason: APPLICATION_NOT_FOUND_REASON } },
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
          ...successfulApplicationNumbers.map((applicationNumber) => ({
            applicationNumber,
            studentId: student.id,
            result: BatchRestrictionStudentResult.Successful,
            failureReason: null,
          })),
          {
            applicationNumber: failedApplicationNumber,
            result: BatchRestrictionStudentResult.Failed,
            failureReason: APPLICATION_NOT_FOUND_REASON,
          },
        ],
        count: 3,
      });
  });

  it("Should return the second page of application numbers when the page limit is two and there are three application numbers in the batch.", async () => {
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
            applicationNumber: failedApplicationNumber,
            result: BatchRestrictionStudentResult.Failed,
            failureReason: APPLICATION_NOT_FOUND_REASON,
          },
        ],
        count: 3,
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
        results: successfulApplicationNumbers.map((applicationNumber) => ({
          applicationNumber,
          studentId: student.id,
          result: BatchRestrictionStudentResult.Successful,
          failureReason: null,
        })),
        count: 2,
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
        results: successfulApplicationNumbers.map((applicationNumber) => ({
          applicationNumber,
          studentId: student.id,
          result: BatchRestrictionStudentResult.Successful,
          failureReason: null,
        })),
        count: 2,
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
