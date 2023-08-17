import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeApplicationOfferingRequestChange,
} from "@sims/test-utils";
import { ApplicationOfferingChangeRequestStatus } from "@sims/sims-db";
import { FieldSortOrder, getISODateOnlyString } from "@sims/utilities";
import { getUserFullName } from "../../../../utilities";

describe("ApplicationOfferingChangeRequestAESTController(e2e)-getAllInProgressApplications", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should return all in progress application offering change requests when requested.", async () => {
    // Arrange

    // Student 1 has an in progress with student application offering change request.
    const inProgressWithStudentApplicationOfferingChange1 =
      await saveFakeApplicationOfferingRequestChange(db);
    // Student 2 has an in progress with SABC application offering change request.
    const inProgressWithSABCApplicationOfferingChange =
      await saveFakeApplicationOfferingRequestChange(db, null, {
        initialValues: {
          applicationOfferingChangeRequestStatus:
            ApplicationOfferingChangeRequestStatus.InProgressWithSABC,
        },
      });
    // Student 3 has an in progress with student application offering change request.
    const inProgressWithStudentApplicationOfferingChange2 =
      await saveFakeApplicationOfferingRequestChange(db);
    // Student 4 has an completed application, that has an approved application offering change request.
    const approvedApplicationOfferingChange =
      await saveFakeApplicationOfferingRequestChange(db, null, {
        initialValues: {
          applicationOfferingChangeRequestStatus:
            ApplicationOfferingChangeRequestStatus.Approved,
        },
      });

    const applicationApprovedApplicationOfferingChange =
      approvedApplicationOfferingChange.application;
    const applicationInProgressWithStudentApplicationOfferingChange1 =
      inProgressWithStudentApplicationOfferingChange1.application;
    const applicationInProgressWithStudentApplicationOfferingChange2 =
      inProgressWithStudentApplicationOfferingChange2.application;
    const applicationInProgressWithSABCApplicationOfferingChange =
      inProgressWithSABCApplicationOfferingChange.application;

    applicationApprovedApplicationOfferingChange.student.user.firstName =
      "Ministry Offering Change Test 1";
    applicationInProgressWithStudentApplicationOfferingChange1.student.user.firstName =
      "Ministry Offering Change Test 2";
    applicationInProgressWithStudentApplicationOfferingChange2.student.user.firstName =
      "Ministry Offering Change Test 3";
    applicationInProgressWithSABCApplicationOfferingChange.student.user.firstName =
      "Ministry Offering Change Test 4";

    await db.user.save([
      applicationApprovedApplicationOfferingChange.student.user,
      applicationInProgressWithStudentApplicationOfferingChange1.student.user,
      applicationInProgressWithStudentApplicationOfferingChange2.student.user,
      applicationInProgressWithSABCApplicationOfferingChange.student.user,
    ]);

    const endpoint = `/aest/application-offering-change-request/in-progress?page=0&pageLimit=10&sortField=status&sortOrder=${FieldSortOrder.DESC}&searchCriteria=Ministry Offering Change Test `;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            id: inProgressWithSABCApplicationOfferingChange.id,
            applicationNumber:
              applicationInProgressWithSABCApplicationOfferingChange.applicationNumber,
            applicationId:
              applicationInProgressWithSABCApplicationOfferingChange.id,
            studyStartDate:
              applicationInProgressWithSABCApplicationOfferingChange
                .currentAssessment.offering.studyStartDate,
            studyEndDate:
              applicationInProgressWithSABCApplicationOfferingChange
                .currentAssessment.offering.studyEndDate,
            fullName: getUserFullName(
              applicationInProgressWithSABCApplicationOfferingChange.student
                .user,
            ),
            status:
              inProgressWithSABCApplicationOfferingChange.applicationOfferingChangeRequestStatus,
            createdAt: getISODateOnlyString(
              applicationInProgressWithSABCApplicationOfferingChange.createdAt,
            ),
            studentId:
              applicationInProgressWithSABCApplicationOfferingChange.student.id,
          },
          {
            id: inProgressWithStudentApplicationOfferingChange1.id,
            applicationNumber:
              applicationInProgressWithStudentApplicationOfferingChange1.applicationNumber,
            applicationId:
              applicationInProgressWithStudentApplicationOfferingChange1.id,
            studyStartDate:
              applicationInProgressWithStudentApplicationOfferingChange1
                .currentAssessment.offering.studyStartDate,
            studyEndDate:
              applicationInProgressWithStudentApplicationOfferingChange1
                .currentAssessment.offering.studyEndDate,
            fullName: getUserFullName(
              applicationInProgressWithStudentApplicationOfferingChange1.student
                .user,
            ),
            status:
              inProgressWithStudentApplicationOfferingChange2.applicationOfferingChangeRequestStatus,
            createdAt: getISODateOnlyString(
              applicationInProgressWithStudentApplicationOfferingChange1.createdAt,
            ),
            studentId:
              applicationInProgressWithStudentApplicationOfferingChange1.student
                .id,
          },
          {
            id: inProgressWithStudentApplicationOfferingChange2.id,
            applicationNumber:
              applicationInProgressWithStudentApplicationOfferingChange2.applicationNumber,
            applicationId:
              applicationInProgressWithStudentApplicationOfferingChange2.id,
            studyStartDate:
              applicationInProgressWithStudentApplicationOfferingChange2
                .currentAssessment.offering.studyStartDate,
            studyEndDate:
              applicationInProgressWithStudentApplicationOfferingChange2
                .currentAssessment.offering.studyEndDate,
            fullName: getUserFullName(
              applicationInProgressWithStudentApplicationOfferingChange2.student
                .user,
            ),
            status:
              inProgressWithStudentApplicationOfferingChange2.applicationOfferingChangeRequestStatus,
            createdAt: getISODateOnlyString(
              applicationInProgressWithStudentApplicationOfferingChange2.createdAt,
            ),
            studentId:
              applicationInProgressWithStudentApplicationOfferingChange2.student
                .id,
          },
        ],
        count: 3,
      });
  });

  it("Should return all in progress application offering change requests filtered by the search criteria when requested.", async () => {
    // Arrange

    // Student 1 has an in progress with student application offering change request.
    await saveFakeApplicationOfferingRequestChange(db);
    // Student 2 has an in progress with SABC application offering change request.
    const inProgressWithSABCApplicationOfferingChange =
      await saveFakeApplicationOfferingRequestChange(db, null, {
        initialValues: {
          applicationOfferingChangeRequestStatus:
            ApplicationOfferingChangeRequestStatus.InProgressWithSABC,
        },
      });
    // Student 3 has an in progress with student application offering change request.
    const inProgressWithStudentApplicationOfferingChange2 =
      await saveFakeApplicationOfferingRequestChange(db);

    const applicationInProgressWithStudentApplicationOfferingChange2 =
      inProgressWithStudentApplicationOfferingChange2.application;
    const applicationInProgressWithSABCApplicationOfferingChange =
      inProgressWithSABCApplicationOfferingChange.application;

    applicationInProgressWithStudentApplicationOfferingChange2.student.user.firstName =
      "Ministry Offering Change Search Criteria Test 1";
    applicationInProgressWithSABCApplicationOfferingChange.student.user.firstName =
      "Ministry Offering Change Search Criteria Test 2";

    await db.user.save([
      applicationInProgressWithStudentApplicationOfferingChange2.student.user,
      applicationInProgressWithSABCApplicationOfferingChange.student.user,
    ]);

    const endpoint = `/aest/application-offering-change-request/in-progress?page=0&pageLimit=10&sortField=status&sortOrder=${FieldSortOrder.DESC}&searchCriteria=Ministry Offering Change Search Criteria Test `;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            id: inProgressWithSABCApplicationOfferingChange.id,
            applicationNumber:
              applicationInProgressWithSABCApplicationOfferingChange.applicationNumber,
            applicationId:
              applicationInProgressWithSABCApplicationOfferingChange.id,
            studyStartDate:
              applicationInProgressWithSABCApplicationOfferingChange
                .currentAssessment.offering.studyStartDate,
            studyEndDate:
              applicationInProgressWithSABCApplicationOfferingChange
                .currentAssessment.offering.studyEndDate,
            fullName: getUserFullName(
              applicationInProgressWithSABCApplicationOfferingChange.student
                .user,
            ),
            status:
              inProgressWithSABCApplicationOfferingChange.applicationOfferingChangeRequestStatus,
            createdAt: getISODateOnlyString(
              applicationInProgressWithSABCApplicationOfferingChange.createdAt,
            ),
            studentId:
              applicationInProgressWithSABCApplicationOfferingChange.student.id,
          },
          {
            id: inProgressWithStudentApplicationOfferingChange2.id,
            applicationNumber:
              applicationInProgressWithStudentApplicationOfferingChange2.applicationNumber,
            applicationId:
              applicationInProgressWithStudentApplicationOfferingChange2.id,
            studyStartDate:
              applicationInProgressWithStudentApplicationOfferingChange2
                .currentAssessment.offering.studyStartDate,
            studyEndDate:
              applicationInProgressWithStudentApplicationOfferingChange2
                .currentAssessment.offering.studyEndDate,
            fullName: getUserFullName(
              applicationInProgressWithStudentApplicationOfferingChange2.student
                .user,
            ),
            status:
              inProgressWithStudentApplicationOfferingChange2.applicationOfferingChangeRequestStatus,
            createdAt: getISODateOnlyString(
              applicationInProgressWithStudentApplicationOfferingChange2.createdAt,
            ),
            studentId:
              applicationInProgressWithStudentApplicationOfferingChange2.student
                .id,
          },
        ],
        count: 2,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
