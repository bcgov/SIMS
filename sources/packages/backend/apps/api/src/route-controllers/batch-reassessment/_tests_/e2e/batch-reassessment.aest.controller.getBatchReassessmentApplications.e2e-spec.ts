import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeBatchReassessment,
  createFakeBatchReassessmentApplication,
  createFakeStudentAssessment,
  createFakeUser,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { Role } from "../../../../auth";
import {
  Application,
  BatchReassessment,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import { BatchReassessmentApplicationResult } from "../../../../services";

const APPLICATION_NOT_FOUND_REASON = "Application not found";

describe("BatchReassessmentAESTController(e2e)-getBatchReassessmentApplications", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let batch: BatchReassessment;
  let completedApplication: Application;
  let cancelledApplication: Application;
  let pendingApplication: Application;
  const failedApplicationNumber = "9999999999";

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const auditUser = await db.user.save(createFakeUser());

    // Creates a batch reassessment with two successful (completed and cancelled assessments),
    // one pending (submitted assessment), and one failed (no assessment) application.
    batch = await db.batchReassessment.save(
      createFakeBatchReassessment({ creator: auditUser }),
    );
    // Successful application (Completed).
    completedApplication = await saveFakeApplication(
      db.dataSource,
      {},
      {
        applicationNumber: "9900000001",
      },
    );
    const completedAssessment = await db.studentAssessment.save(
      createFakeStudentAssessment(
        { auditUser, application: completedApplication },
        {
          initialValue: {
            studentAssessmentStatus: StudentAssessmentStatus.Completed,
          },
        },
      ),
    );
    // Successful application (Cancelled).
    cancelledApplication = await saveFakeApplication(
      db.dataSource,
      {},
      {
        applicationNumber: "9900000002",
      },
    );
    const cancelledAssessment = await db.studentAssessment.save(
      createFakeStudentAssessment(
        { auditUser, application: cancelledApplication },
        {
          initialValue: {
            studentAssessmentStatus: StudentAssessmentStatus.Cancelled,
          },
        },
      ),
    );
    // Pending application (Submitted).
    pendingApplication = await saveFakeApplication(
      db.dataSource,
      {},
      {
        applicationNumber: "9910000001",
      },
    );
    const submittedAssessment = await db.studentAssessment.save(
      createFakeStudentAssessment({
        auditUser,
        application: pendingApplication,
      }),
    );
    // Batch applications, where the failed one has no assessment.
    await db.batchReassessmentApplication.save([
      createFakeBatchReassessmentApplication({
        batchReassessment: batch,
        applicationNumber: completedApplication.applicationNumber,
        studentAssessment: completedAssessment,
        creator: auditUser,
      }),
      createFakeBatchReassessmentApplication({
        batchReassessment: batch,
        applicationNumber: cancelledApplication.applicationNumber,
        studentAssessment: cancelledAssessment,
        creator: auditUser,
      }),
      createFakeBatchReassessmentApplication({
        batchReassessment: batch,
        applicationNumber: pendingApplication.applicationNumber,
        studentAssessment: submittedAssessment,
        creator: auditUser,
      }),
      createFakeBatchReassessmentApplication(
        {
          batchReassessment: batch,
          applicationNumber: failedApplicationNumber,
          creator: auditUser,
        },
        { initialValues: { failureReason: APPLICATION_NOT_FOUND_REASON } },
      ),
    ]);
  });

  it("Should return all applications of the batch ordered by application number when no sort or filter options are provided.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    const endpoint = getEndpoint(batch.id, "page=0&pageLimit=10");
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            applicationNumber: completedApplication.applicationNumber,
            applicationId: completedApplication.id,
            studentId: completedApplication.student.id,
            result: BatchReassessmentApplicationResult.Successful,
            failureReason: null,
          },
          {
            applicationNumber: cancelledApplication.applicationNumber,
            applicationId: cancelledApplication.id,
            studentId: cancelledApplication.student.id,
            result: BatchReassessmentApplicationResult.Successful,
            failureReason: null,
          },
          {
            applicationNumber: pendingApplication.applicationNumber,
            applicationId: pendingApplication.id,
            studentId: pendingApplication.student.id,
            result: BatchReassessmentApplicationResult.Pending,
            failureReason: null,
          },
          {
            applicationNumber: failedApplicationNumber,
            result: BatchReassessmentApplicationResult.Failed,
            failureReason: APPLICATION_NOT_FOUND_REASON,
          },
        ],
        count: 4,
      });
  });

  it("Should return the second page of applications when the page limit is two and there are four applications in the batch.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    const endpoint = getEndpoint(batch.id, "page=1&pageLimit=2");
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            applicationNumber: pendingApplication.applicationNumber,
            applicationId: pendingApplication.id,
            studentId: pendingApplication.student.id,
            result: BatchReassessmentApplicationResult.Pending,
            failureReason: null,
          },
          {
            applicationNumber: failedApplicationNumber,
            result: BatchReassessmentApplicationResult.Failed,
            failureReason: APPLICATION_NOT_FOUND_REASON,
          },
        ],
        count: 4,
      });
  });

  it("Should return only the applications partially matching the application number when the search criteria is provided with an explicit sort.", async () => {
    // Arrange
    // The search criteria matches 9900000001 and 9900000002, returned in descending order.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    const endpoint = getEndpoint(
      batch.id,
      "page=0&pageLimit=10&searchCriteria=990000&sortField=applicationNumber&sortOrder=DESC",
    );
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            applicationNumber: cancelledApplication.applicationNumber,
            applicationId: cancelledApplication.id,
            studentId: cancelledApplication.student.id,
            result: BatchReassessmentApplicationResult.Successful,
            failureReason: null,
          },
          {
            applicationNumber: completedApplication.applicationNumber,
            applicationId: completedApplication.id,
            studentId: completedApplication.student.id,
            result: BatchReassessmentApplicationResult.Successful,
            failureReason: null,
          },
        ],
        count: 2,
      });
  });

  Object.values(BatchReassessmentApplicationResult).forEach((result) => {
    it(`Should return only the ${result} applications when the result filter is ${result}.`, async () => {
      // Arrange
      // Expected results are built here since the batch is only created in beforeAll.
      const expectedResults = [
        {
          applicationNumber: completedApplication.applicationNumber,
          applicationId: completedApplication.id,
          studentId: completedApplication.student.id,
          result: BatchReassessmentApplicationResult.Successful,
          failureReason: null,
        },
        {
          applicationNumber: cancelledApplication.applicationNumber,
          applicationId: cancelledApplication.id,
          studentId: cancelledApplication.student.id,
          result: BatchReassessmentApplicationResult.Successful,
          failureReason: null,
        },
        {
          applicationNumber: pendingApplication.applicationNumber,
          applicationId: pendingApplication.id,
          studentId: pendingApplication.student.id,
          result: BatchReassessmentApplicationResult.Pending,
          failureReason: null,
        },
        {
          applicationNumber: failedApplicationNumber,
          result: BatchReassessmentApplicationResult.Failed,
          failureReason: APPLICATION_NOT_FOUND_REASON,
        },
      ].filter((expectedResult) => expectedResult.result === result);
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      const endpoint = getEndpoint(
        batch.id,
        `page=0&pageLimit=10&result=${result}`,
      );
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({ results: expectedResults, count: expectedResults.length });
    });
  });

  it("Should throw a HttpStatus Not Found (404) error when the batch reassessment does not exist.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    const endpoint = getEndpoint(99999999, "page=0&pageLimit=10");
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Batch reassessment with ID 99999999 not found.",
        error: "Not Found",
      });
  });

  it("Should throw a HttpStatus Bad Request (400) error when the result filter is invalid.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    const endpoint = getEndpoint(
      1,
      "page=0&pageLimit=10&result=SomeInvalidResult",
    );
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: [
          "result must be one of the following values: Successful, Failed, Pending",
        ],
        error: "Bad Request",
      });
  });

  it("Should throw a HttpStatus Bad Request (400) error when the sortField is invalid.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    const endpoint = getEndpoint(
      1,
      "page=0&pageLimit=10&sortField=SomeInvalidField",
    );
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: [
          "sortField must be one of the following values: applicationNumber",
        ],
        error: "Bad Request",
      });
  });

  it(`Should throw a HttpStatus Forbidden (403) error when the AEST user does not have the ${Role.AESTBatchReassessment} role.`, async () => {
    // Arrange
    const token = await getAESTToken();

    // Act/Assert
    const endpoint = getEndpoint(1, "page=0&pageLimit=10");
    await request(app.getHttpServer())
      .get(endpoint)
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
 * Gets the endpoint for the applications of a batch reassessment for AEST users.
 * @param batchReassessmentId batch reassessment ID.
 * @param queryString pagination query string.
 * @returns the endpoint for the applications of a batch reassessment.
 */
function getEndpoint(batchReassessmentId: number, queryString: string): string {
  return `/aest/batch-reassessment/${batchReassessmentId}/applications?${queryString}`;
}
