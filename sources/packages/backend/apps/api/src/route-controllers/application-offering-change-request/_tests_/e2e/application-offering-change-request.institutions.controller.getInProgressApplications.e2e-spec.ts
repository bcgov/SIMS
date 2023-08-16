import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import {
  createFakeInstitutionLocation,
  saveFakeApplicationDisbursements,
  E2EDataSources,
  createE2EDataSources,
  saveFakeApplicationOfferingRequestChange,
} from "@sims/test-utils";
import {
  ApplicationOfferingChangeRequestStatus,
  ApplicationStatus,
  InstitutionLocation,
} from "@sims/sims-db";
import { FieldSortOrder } from "@sims/utilities";
import { getUserFullName } from "../../../../utilities";

describe("ApplicationOfferingChangeRequestInstitutionsController(e2e)-getInProgressApplications", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeFLocation: InstitutionLocation;
  let institutionUserToken: string;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    // College F.
    const { institution: collegeF } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
    // Institution token.
    institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
  });

  it(`Should return all in progress application offering change requests for the location in ${FieldSortOrder.DESC} order of name when requested.`, async () => {
    // Arrange

    // Student 1 has a completed application to the institution.
    await saveFakeApplicationDisbursements(
      db.dataSource,
      { institutionLocation: collegeFLocation },
      {
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    // Student 2 has an in progress with student application offering change request for the institution.
    const inProgressWithStudentApplicationOfferingChange =
      await saveFakeApplicationOfferingRequestChange(db, {
        institutionLocation: collegeFLocation,
      });
    // Student 3 has an in progress with SABC application offering change request for the institution.
    const inProgressWithSABCApplicationOfferingChange =
      await saveFakeApplicationOfferingRequestChange(
        db,
        {
          institutionLocation: collegeFLocation,
        },
        {
          initialValues: {
            applicationOfferingChangeRequestStatus:
              ApplicationOfferingChangeRequestStatus.InProgressWithSABC,
          },
        },
      );
    // Student 4 has an in progress with student application offering change request with a different institution.
    await saveFakeApplicationOfferingRequestChange(db);
    // Student 5 has an completed application for the institution, that have an approved application offering change request.
    await saveFakeApplicationOfferingRequestChange(
      db,
      {
        institutionLocation: collegeFLocation,
      },
      {
        initialValues: {
          applicationOfferingChangeRequestStatus:
            ApplicationOfferingChangeRequestStatus.Approved,
        },
      },
    );
    const applicationWithInProgressWithStudentApplicationOfferingChange =
      inProgressWithStudentApplicationOfferingChange.application;
    const applicationWithInProgressWithSABCApplicationOfferingChange =
      inProgressWithSABCApplicationOfferingChange.application;

    applicationWithInProgressWithStudentApplicationOfferingChange.student.user.firstName =
      "Alex";
    applicationWithInProgressWithSABCApplicationOfferingChange.student.user.firstName =
      "Zachariah";

    await db.user.save([
      applicationWithInProgressWithStudentApplicationOfferingChange.student
        .user,
      applicationWithInProgressWithSABCApplicationOfferingChange.student.user,
    ]);

    const endpoint = `/institutions/location/${collegeFLocation.id}/application-offering-change-request/in-progress?page=0&pageLimit=10&sortField=fullName&sortOrder=${FieldSortOrder.DESC}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            id: inProgressWithSABCApplicationOfferingChange.id,
            applicationNumber:
              applicationWithInProgressWithSABCApplicationOfferingChange.applicationNumber,
            studyStartDate:
              applicationWithInProgressWithSABCApplicationOfferingChange
                .currentAssessment.offering.studyStartDate,
            studyEndDate:
              applicationWithInProgressWithSABCApplicationOfferingChange
                .currentAssessment.offering.studyEndDate,
            fullName: getUserFullName(
              applicationWithInProgressWithSABCApplicationOfferingChange.student
                .user,
            ),
            status:
              inProgressWithSABCApplicationOfferingChange.applicationOfferingChangeRequestStatus,
          },
          {
            id: inProgressWithStudentApplicationOfferingChange.id,
            applicationNumber:
              applicationWithInProgressWithStudentApplicationOfferingChange.applicationNumber,
            studyStartDate:
              applicationWithInProgressWithStudentApplicationOfferingChange
                .currentAssessment.offering.studyStartDate,
            studyEndDate:
              applicationWithInProgressWithStudentApplicationOfferingChange
                .currentAssessment.offering.studyEndDate,
            fullName: getUserFullName(
              applicationWithInProgressWithStudentApplicationOfferingChange
                .student.user,
            ),
            status:
              inProgressWithStudentApplicationOfferingChange.applicationOfferingChangeRequestStatus,
          },
        ],
        count: 2,
      });
  });

  it("Should return only matching in progress application offering changes for the location when searched.", async () => {
    // Arrange

    // Student 1 has an in progress with student application offering change request for the institution.
    await saveFakeApplicationOfferingRequestChange(db, {
      institutionLocation: collegeFLocation,
    });
    // Student 2 has an in progress with SABC application offering change request for the institution.
    const inProgressWithSABCApplicationOfferingChange =
      await saveFakeApplicationOfferingRequestChange(
        db,
        {
          institutionLocation: collegeFLocation,
        },
        {
          initialValues: {
            applicationOfferingChangeRequestStatus:
              ApplicationOfferingChangeRequestStatus.InProgressWithSABC,
          },
        },
      );
    const applicationWithInProgressWithSABCApplicationOfferingChange =
      inProgressWithSABCApplicationOfferingChange.application;

    applicationWithInProgressWithSABCApplicationOfferingChange.student.user.firstName =
      "Test";
    applicationWithInProgressWithSABCApplicationOfferingChange.student.user.lastName =
      "Student";
    await db.user.save(
      applicationWithInProgressWithSABCApplicationOfferingChange.student.user,
    );

    const applicationWithInProgressWithSABCApplicationOfferingChangeFullName =
      getUserFullName(
        applicationWithInProgressWithSABCApplicationOfferingChange.student.user,
      );
    const endpoint = `/institutions/location/${collegeFLocation.id}/application-offering-change-request/in-progress?page=0&pageLimit=10&searchCriteria=${applicationWithInProgressWithSABCApplicationOfferingChangeFullName}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            id: inProgressWithSABCApplicationOfferingChange.id,
            applicationNumber:
              applicationWithInProgressWithSABCApplicationOfferingChange.applicationNumber,
            studyStartDate:
              applicationWithInProgressWithSABCApplicationOfferingChange
                .currentAssessment.offering.studyStartDate,
            studyEndDate:
              applicationWithInProgressWithSABCApplicationOfferingChange
                .currentAssessment.offering.studyEndDate,
            fullName: getUserFullName(
              applicationWithInProgressWithSABCApplicationOfferingChange.student
                .user,
            ),
            status:
              inProgressWithSABCApplicationOfferingChange.applicationOfferingChangeRequestStatus,
          },
        ],
        count: 1,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
