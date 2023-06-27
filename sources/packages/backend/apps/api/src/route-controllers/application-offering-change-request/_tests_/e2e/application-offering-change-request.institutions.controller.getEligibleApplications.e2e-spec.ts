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

describe("ApplicationOfferingChangeRequestInstitutionsController(e2e)-getEligibleApplications", () => {
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

  it(
    `Should return all available eligible application that can be requested for an application` +
      `offering change for the location in ${FieldSortOrder.DESC} order of application number when requested.`,
    async () => {
      // Arrange

      // Student 1 has a completed application to the institution.
      const applicationA = await saveFakeApplicationDisbursements(
        db.dataSource,
        { institutionLocation: collegeFLocation },
        {
          applicationStatus: ApplicationStatus.Completed,
        },
      );
      // Student 2 has a completed application to the institution.
      const applicationB = await saveFakeApplicationDisbursements(
        db.dataSource,
        { institutionLocation: collegeFLocation },
        {
          applicationStatus: ApplicationStatus.Completed,
        },
      );
      // Student 3 has an application waiting for assessment to the institution.
      await saveFakeApplicationDisbursements(db.dataSource, {
        institutionLocation: collegeFLocation,
      });
      // Student 4 has a completed application for a different institution.
      await saveFakeApplicationDisbursements(db.dataSource, undefined, {
        applicationStatus: ApplicationStatus.Completed,
      });
      // Student 5 has a completed application for the institution, that have a pending application offering change request.
      await saveFakeApplicationOfferingRequestChange(db.dataSource, {
        institutionLocation: collegeFLocation,
      });
      // Student 6 has a completed application for the institution, that have a approved application offering change request.
      const applicationOfferingChange =
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
      const applicationC = applicationOfferingChange.application;

      applicationA.applicationNumber = "1000000000";
      applicationB.applicationNumber = "1000000001";
      applicationC.applicationNumber = "1000000002";
      await db.application.save([applicationA, applicationB, applicationC]);

      const endpoint = `/institutions/location/${collegeFLocation.id}/application-offering-change-request/available?page=0&pageLimit=10&sortField=applicationNumber&sortOrder=${FieldSortOrder.DESC}`;
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
              applicationNumber: applicationC.applicationNumber,
              applicationId: applicationC.id,
              studyStartDate:
                applicationC.currentAssessment.offering.studyStartDate,
              studyEndDate:
                applicationC.currentAssessment.offering.studyEndDate,
              fullName: getUserFullName(applicationC.student.user),
            },
            {
              applicationNumber: applicationB.applicationNumber,
              applicationId: applicationB.id,
              studyStartDate:
                applicationB.currentAssessment.offering.studyStartDate,
              studyEndDate:
                applicationB.currentAssessment.offering.studyEndDate,
              fullName: getUserFullName(applicationB.student.user),
            },
            {
              applicationNumber: applicationA.applicationNumber,
              applicationId: applicationA.id,
              studyStartDate:
                applicationA.currentAssessment.offering.studyStartDate,
              studyEndDate:
                applicationA.currentAssessment.offering.studyEndDate,
              fullName: getUserFullName(applicationA.student.user),
            },
          ],
          count: 3,
        });
    },
  );

  it("Should return only matching available eligible application that can be requested for an application offering change for the location when searched.", async () => {
    // Arrange

    // Student 1 has a completed application to the institution.
    const applicationA = await saveFakeApplicationDisbursements(
      db.dataSource,
      { institutionLocation: collegeFLocation },
      {
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    // Student 2 has a completed application to the institution.
    await saveFakeApplicationDisbursements(
      db.dataSource,
      { institutionLocation: collegeFLocation },
      {
        applicationStatus: ApplicationStatus.Completed,
      },
    );

    const endpoint = `/institutions/location/${collegeFLocation.id}/application-offering-change-request/available?page=0&pageLimit=10&searchCriteria=${applicationA.applicationNumber}`;
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
            applicationNumber: applicationA.applicationNumber,
            applicationId: applicationA.id,
            studyStartDate:
              applicationA.currentAssessment.offering.studyStartDate,
            studyEndDate: applicationA.currentAssessment.offering.studyEndDate,
            fullName: getUserFullName(applicationA.student.user),
          },
        ],
        count: 1,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
