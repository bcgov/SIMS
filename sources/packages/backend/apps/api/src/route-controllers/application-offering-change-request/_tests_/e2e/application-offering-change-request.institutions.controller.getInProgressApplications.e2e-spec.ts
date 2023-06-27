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

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    // College F.
    const { institution: collegeF } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFLocation = createFakeInstitutionLocation(collegeF);
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
  });

  it(`Should return all in progress application offering change request for the location in ${FieldSortOrder.DESC} order of name when requested.`, async () => {
    // Arrange

    // Student 1 has a completed application to the institution.
    await saveFakeApplicationDisbursements(
      db.dataSource,
      { institutionLocation: collegeFLocation },
      {
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    // Student 2 has a in progress with student application offering change request for the institution,
    const applicationOfferingChange2 =
      await saveFakeApplicationOfferingRequestChange(db.dataSource, {
        institutionLocation: collegeFLocation,
      });
    // Student 3 has a in progress with SABC application offering change request for the institution,
    const applicationOfferingChange3 =
      await saveFakeApplicationOfferingRequestChange(
        db.dataSource,
        {
          institutionLocation: collegeFLocation,
        },
        {
          applicationOfferingChangeRequestStatus:
            ApplicationOfferingChangeRequestStatus.InProgressWithSABC,
        },
      );
    // Student 4 has a in progress with student application offering change request with a different institution,
    await saveFakeApplicationOfferingRequestChange(db.dataSource);
    // Student 5 has a completed application for the institution, that have a approved application offering change request.
    await saveFakeApplicationOfferingRequestChange(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      {
        applicationOfferingChangeRequestStatus:
          ApplicationOfferingChangeRequestStatus.Approved,
      },
    );
    const application2 = applicationOfferingChange2.application;
    const application3 = applicationOfferingChange3.application;

    application2.student.user.firstName = "Alex";
    application3.student.user.firstName = "Zachariah";

    await db.user.save([application2.student.user, application3.student.user]);

    const endpoint = `/institutions/location/${collegeFLocation.id}/application-offering-change-request/in-progress?page=0&pageLimit=10&sortField=fullName&sortOrder=${FieldSortOrder.DESC}`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            applicationNumber: application3.applicationNumber,
            studyStartDate:
              application3.currentAssessment.offering.studyStartDate,
            studyEndDate: application3.currentAssessment.offering.studyEndDate,
            fullName: getUserFullName(application3.student.user),
            status:
              applicationOfferingChange3.applicationOfferingChangeRequestStatus,
          },
          {
            applicationNumber: application2.applicationNumber,
            studyStartDate:
              application2.currentAssessment.offering.studyStartDate,
            studyEndDate: application2.currentAssessment.offering.studyEndDate,
            fullName: getUserFullName(application2.student.user),
            status:
              applicationOfferingChange2.applicationOfferingChangeRequestStatus,
          },
        ],
        count: 2,
      });
  });

  it("Should return only matching in progress application that can be requested for an application offering change for the location when searched.", async () => {
    // Arrange

    // Student 1 has a in progress with student application offering change request for the institution,
    await saveFakeApplicationOfferingRequestChange(db.dataSource, {
      institutionLocation: collegeFLocation,
    });
    // Student 2 has a in progress with SABC application offering change request for the institution,
    const applicationOfferingChange2 =
      await saveFakeApplicationOfferingRequestChange(
        db.dataSource,
        {
          institutionLocation: collegeFLocation,
        },
        {
          applicationOfferingChangeRequestStatus:
            ApplicationOfferingChangeRequestStatus.InProgressWithSABC,
        },
      );
    const application2 = applicationOfferingChange2.application;

    application2.student.user.firstName = "Test";
    application2.student.user.lastName = "Student";
    await db.user.save(application2.student.user);

    const endpoint = `/institutions/location/${
      collegeFLocation.id
    }/application-offering-change-request/in-progress?page=0&pageLimit=10&searchCriteria=${getUserFullName(
      application2.student.user,
    )}`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            applicationNumber: application2.applicationNumber,
            studyStartDate:
              application2.currentAssessment.offering.studyStartDate,
            studyEndDate: application2.currentAssessment.offering.studyEndDate,
            fullName: getUserFullName(application2.student.user),
            status:
              applicationOfferingChange2.applicationOfferingChangeRequestStatus,
          },
        ],
        count: 1,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
