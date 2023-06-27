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

describe("ApplicationOfferingChangeRequestInstitutionsController(e2e)-getCompletedApplications", () => {
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

  it(`Should return all completed application offering change request for the location in ${FieldSortOrder.ASC} order of name when requested.`, async () => {
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
    await saveFakeApplicationOfferingRequestChange(db.dataSource, {
      institutionLocation: collegeFLocation,
    });
    // Student 3 has a approved application offering change request for the institution,
    const applicationOfferingChange3 =
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
    // Student 4 has a in progress with student application offering change request with a different institution,
    await saveFakeApplicationOfferingRequestChange(db.dataSource);
    // Student 5 has a declined by student application for the institution, that have a approved application offering change request.
    const applicationOfferingChange5 =
      await saveFakeApplicationOfferingRequestChange(
        db.dataSource,
        {
          institutionLocation: collegeFLocation,
        },
        {
          applicationOfferingChangeRequestStatus:
            ApplicationOfferingChangeRequestStatus.DeclinedByStudent,
        },
      );
    // Student 6 has a declined by student application for the institution, that have a approved application offering change request.
    const applicationOfferingChange6 =
      await saveFakeApplicationOfferingRequestChange(
        db.dataSource,
        {
          institutionLocation: collegeFLocation,
        },
        {
          applicationOfferingChangeRequestStatus:
            ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
        },
      );

    applicationOfferingChange3.assessedDate = new Date();
    applicationOfferingChange5.studentActionDate = new Date();
    applicationOfferingChange6.assessedDate = new Date();

    await db.applicationOfferingChangeRequest.save([
      applicationOfferingChange3,
      applicationOfferingChange5,
      applicationOfferingChange6,
    ]);

    const application3 = applicationOfferingChange3.application;
    const application5 = applicationOfferingChange5.application;
    const application6 = applicationOfferingChange6.application;

    application3.applicationNumber = "1000000000";
    application5.applicationNumber = "1000000001";
    application6.applicationNumber = "1000000002";

    await db.application.save([application3, application5, application6]);

    const endpoint = `/institutions/location/${collegeFLocation.id}/application-offering-change-request/completed?page=0&pageLimit=10&sortField=applicationNumber&sortOrder=${FieldSortOrder.ASC}`;
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
            dateCompleted:
              applicationOfferingChange3.assessedDate.toISOString(),
          },
          {
            applicationNumber: application5.applicationNumber,
            studyStartDate:
              application5.currentAssessment.offering.studyStartDate,
            studyEndDate: application5.currentAssessment.offering.studyEndDate,
            fullName: getUserFullName(application5.student.user),
            status:
              applicationOfferingChange5.applicationOfferingChangeRequestStatus,
            dateCompleted:
              applicationOfferingChange5.studentActionDate.toISOString(),
          },
          {
            applicationNumber: application6.applicationNumber,
            studyStartDate:
              application6.currentAssessment.offering.studyStartDate,
            studyEndDate: application6.currentAssessment.offering.studyEndDate,
            fullName: getUserFullName(application6.student.user),
            status:
              applicationOfferingChange6.applicationOfferingChangeRequestStatus,
            dateCompleted:
              applicationOfferingChange6.assessedDate.toISOString(),
          },
        ],
        count: 3,
      });
  });

  it("Should return only matching completed application that can be requested for an application offering change for the location when searched.", async () => {
    // Arrange

    // Student 1 has a approved application offering change request for the institution,
    const applicationOfferingChange1 =
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
    // Student 2 has a approved with student application offering change request with a different institution,
    const applicationOfferingChange2 =
      await saveFakeApplicationOfferingRequestChange(db.dataSource, undefined, {
        applicationOfferingChangeRequestStatus:
          ApplicationOfferingChangeRequestStatus.Approved,
      });
    // Student 3 has a declined by student application for the institution, that have a approved application offering change request.
    await saveFakeApplicationOfferingRequestChange(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      {
        applicationOfferingChangeRequestStatus:
          ApplicationOfferingChangeRequestStatus.DeclinedByStudent,
      },
    );
    // Student 4 has a declined ny student application for the institution, that have a approved application offering change request.
    await saveFakeApplicationOfferingRequestChange(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      {
        applicationOfferingChangeRequestStatus:
          ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
      },
    );

    applicationOfferingChange1.assessedDate = new Date();

    await db.applicationOfferingChangeRequest.save(applicationOfferingChange1);

    const application1 = applicationOfferingChange1.application;
    const application2 = applicationOfferingChange2.application;

    application1.student.user.firstName = "TestStudent";
    // Student 2 belong to different institution but have same name.
    application2.student.user.firstName = "TestStudent";

    await db.user.save([application1.student.user, application2.student.user]);

    const endpoint = `/institutions/location/${collegeFLocation.id}/application-offering-change-request/completed?page=0&pageLimit=10&searchCriteria=${application1.student.user.firstName}`;
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
            applicationNumber: application1.applicationNumber,
            studyStartDate:
              application1.currentAssessment.offering.studyStartDate,
            studyEndDate: application1.currentAssessment.offering.studyEndDate,
            fullName: getUserFullName(application1.student.user),
            status:
              applicationOfferingChange1.applicationOfferingChangeRequestStatus,
            dateCompleted:
              applicationOfferingChange1.assessedDate.toISOString(),
          },
        ],
        count: 1,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
