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
    `Should return all available eligible applications that can be requested for an application ` +
      `offering change for the location in ${FieldSortOrder.DESC} order of application number when requested.`,
    async () => {
      // Arrange

      // Student 1 has a completed application to the institution.
      const completedApplication = await saveFakeApplicationDisbursements(
        db.dataSource,
        { institutionLocation: collegeFLocation },
        {
          applicationStatus: ApplicationStatus.Completed,
        },
      );
      // Student 2 has a completed application to the institution, which will be archived.
      const archivedCompletedApplication =
        await saveFakeApplicationDisbursements(
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
      await saveFakeApplicationOfferingRequestChange(db, {
        institutionLocation: collegeFLocation,
      });
      // Student 6 has a completed application for the institution, that have an approved application offering change request.
      const approvedApplicationOfferingChange =
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
      const applicationWithApprovedApplicationOfferingChange =
        approvedApplicationOfferingChange.application;

      // Set application as archived.
      archivedCompletedApplication.isArchived = true;

      completedApplication.applicationNumber = "1000000000";
      applicationWithApprovedApplicationOfferingChange.applicationNumber =
        "1000000001";
      await db.application.save([
        completedApplication,
        archivedCompletedApplication,
        applicationWithApprovedApplicationOfferingChange,
      ]);

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
              applicationNumber:
                applicationWithApprovedApplicationOfferingChange.applicationNumber,
              applicationId:
                applicationWithApprovedApplicationOfferingChange.id,
              studyStartDate:
                applicationWithApprovedApplicationOfferingChange
                  .currentAssessment.offering.studyStartDate,
              studyEndDate:
                applicationWithApprovedApplicationOfferingChange
                  .currentAssessment.offering.studyEndDate,
              fullName: getUserFullName(
                applicationWithApprovedApplicationOfferingChange.student.user,
              ),
            },
            {
              applicationNumber: completedApplication.applicationNumber,
              applicationId: completedApplication.id,
              studyStartDate:
                completedApplication.currentAssessment.offering.studyStartDate,
              studyEndDate:
                completedApplication.currentAssessment.offering.studyEndDate,
              fullName: getUserFullName(completedApplication.student.user),
            },
          ],
          count: 2,
        });
    },
  );

  it("Should return only matching available eligible applications that can be requested for an application offering change for the location when searched.", async () => {
    // Arrange

    // Student 1 has a completed application to the institution.
    const completedApplication = await saveFakeApplicationDisbursements(
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

    const endpoint = `/institutions/location/${collegeFLocation.id}/application-offering-change-request/available?page=0&pageLimit=10&searchCriteria=${completedApplication.applicationNumber}`;
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
            applicationNumber: completedApplication.applicationNumber,
            applicationId: completedApplication.id,
            studyStartDate:
              completedApplication.currentAssessment.offering.studyStartDate,
            studyEndDate:
              completedApplication.currentAssessment.offering.studyEndDate,
            fullName: getUserFullName(completedApplication.student.user),
          },
        ],
        count: 1,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
