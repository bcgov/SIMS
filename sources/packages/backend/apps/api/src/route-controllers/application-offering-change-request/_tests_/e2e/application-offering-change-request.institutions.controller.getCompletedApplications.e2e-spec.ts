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
    collegeFLocation = createFakeInstitutionLocation(collegeF);
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

  it(`Should return all completed application offering change requests for the location in ${FieldSortOrder.ASC} order of name when requested.`, async () => {
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
    await saveFakeApplicationOfferingRequestChange(db, {
      institutionLocation: collegeFLocation,
    });
    // Student 3 has an approved application offering change request for the institution.
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
    // Student 4 has an in progress with student application offering change request with a different institution.
    await saveFakeApplicationOfferingRequestChange(db);
    // Student 5 has a declined by student application application offering change request.
    const declinedByStudentApplicationOfferingChange =
      await saveFakeApplicationOfferingRequestChange(
        db,
        {
          institutionLocation: collegeFLocation,
        },
        {
          initialValues: {
            applicationOfferingChangeRequestStatus:
              ApplicationOfferingChangeRequestStatus.DeclinedByStudent,
          },
        },
      );
    // Student 6 has a declined by SABC application offering change request.
    const declinedBySABCApplicationOfferingChange =
      await saveFakeApplicationOfferingRequestChange(
        db,
        {
          institutionLocation: collegeFLocation,
        },
        {
          initialValues: {
            applicationOfferingChangeRequestStatus:
              ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
          },
        },
      );

    approvedApplicationOfferingChange.assessedDate = new Date();
    declinedByStudentApplicationOfferingChange.studentActionDate = new Date();
    declinedBySABCApplicationOfferingChange.assessedDate = new Date();

    await db.applicationOfferingChangeRequest.save([
      approvedApplicationOfferingChange,
      declinedByStudentApplicationOfferingChange,
      declinedBySABCApplicationOfferingChange,
    ]);

    const applicationWithApprovedApplicationOfferingChange =
      approvedApplicationOfferingChange.application;
    const applicationWithDeclinedByStudentApplicationOfferingChange =
      declinedByStudentApplicationOfferingChange.application;
    const applicationWithDeclinedBySABCApplicationOfferingChange =
      declinedBySABCApplicationOfferingChange.application;

    applicationWithApprovedApplicationOfferingChange.applicationNumber =
      "1000000002";
    applicationWithDeclinedByStudentApplicationOfferingChange.applicationNumber =
      "1000000001";
    applicationWithDeclinedBySABCApplicationOfferingChange.applicationNumber =
      "1000000000";

    await db.application.save([
      applicationWithApprovedApplicationOfferingChange,
      applicationWithDeclinedByStudentApplicationOfferingChange,
      applicationWithDeclinedBySABCApplicationOfferingChange,
    ]);

    const endpoint = `/institutions/location/${collegeFLocation.id}/application-offering-change-request/completed?page=0&pageLimit=10&sortField=applicationNumber&sortOrder=${FieldSortOrder.ASC}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            applicationNumber:
              applicationWithDeclinedBySABCApplicationOfferingChange.applicationNumber,
            studyStartDate:
              applicationWithDeclinedBySABCApplicationOfferingChange
                .currentAssessment.offering.studyStartDate,
            studyEndDate:
              applicationWithDeclinedBySABCApplicationOfferingChange
                .currentAssessment.offering.studyEndDate,
            fullName: getUserFullName(
              applicationWithDeclinedBySABCApplicationOfferingChange.student
                .user,
            ),
            status:
              declinedBySABCApplicationOfferingChange.applicationOfferingChangeRequestStatus,
            dateCompleted:
              declinedBySABCApplicationOfferingChange.assessedDate.toISOString(),
          },
          {
            applicationNumber:
              applicationWithDeclinedByStudentApplicationOfferingChange.applicationNumber,
            studyStartDate:
              applicationWithDeclinedByStudentApplicationOfferingChange
                .currentAssessment.offering.studyStartDate,
            studyEndDate:
              applicationWithDeclinedByStudentApplicationOfferingChange
                .currentAssessment.offering.studyEndDate,
            fullName: getUserFullName(
              applicationWithDeclinedByStudentApplicationOfferingChange.student
                .user,
            ),
            status:
              declinedByStudentApplicationOfferingChange.applicationOfferingChangeRequestStatus,
            dateCompleted:
              declinedByStudentApplicationOfferingChange.studentActionDate.toISOString(),
          },
          {
            applicationNumber:
              applicationWithApprovedApplicationOfferingChange.applicationNumber,
            studyStartDate:
              applicationWithApprovedApplicationOfferingChange.currentAssessment
                .offering.studyStartDate,
            studyEndDate:
              applicationWithApprovedApplicationOfferingChange.currentAssessment
                .offering.studyEndDate,
            fullName: getUserFullName(
              applicationWithApprovedApplicationOfferingChange.student.user,
            ),
            status:
              approvedApplicationOfferingChange.applicationOfferingChangeRequestStatus,
            dateCompleted:
              approvedApplicationOfferingChange.assessedDate.toISOString(),
          },
        ],
        count: 3,
      });
  });

  it("Should return only matching completed application offering changes for the location when searched.", async () => {
    // Arrange

    // Student 1 has an approved application offering change request for the institution.
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
    // Student 2 has an approved with student application offering change request with a different institution.
    const approvedApplicationOfferingChangeForDifferentLocation =
      await saveFakeApplicationOfferingRequestChange(db, undefined, {
        initialValues: {
          applicationOfferingChangeRequestStatus:
            ApplicationOfferingChangeRequestStatus.Approved,
        },
      });
    // Student 3 has a declined by student application offering change request.
    await saveFakeApplicationOfferingRequestChange(
      db,
      {
        institutionLocation: collegeFLocation,
      },
      {
        initialValues: {
          applicationOfferingChangeRequestStatus:
            ApplicationOfferingChangeRequestStatus.DeclinedByStudent,
        },
      },
    );
    // Student 4 has a declined by SABC offering change request.
    const declinedBySABCApplicationOfferingChange =
      await saveFakeApplicationOfferingRequestChange(
        db,
        {
          institutionLocation: collegeFLocation,
        },
        {
          initialValues: {
            applicationOfferingChangeRequestStatus:
              ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
          },
        },
      );

    approvedApplicationOfferingChange.assessedDate = new Date();
    declinedBySABCApplicationOfferingChange.assessedDate = new Date();

    await db.applicationOfferingChangeRequest.save([
      approvedApplicationOfferingChange,
      declinedBySABCApplicationOfferingChange,
    ]);

    const applicationWithApprovedApplicationOfferingChange =
      approvedApplicationOfferingChange.application;
    const applicationWithApprovedApplicationOfferingChangeForDifferentLocation =
      approvedApplicationOfferingChangeForDifferentLocation.application;
    const applicationWithDeclinedBySABCApplicationOfferingChange =
      declinedBySABCApplicationOfferingChange.application;

    applicationWithApprovedApplicationOfferingChange.student.user.firstName =
      "TestStudentSuffix";
    // Student 2 belong to different institution but have same name.
    applicationWithApprovedApplicationOfferingChangeForDifferentLocation.student.user.firstName =
      "TestStudentSuffix";
    applicationWithDeclinedBySABCApplicationOfferingChange.student.user.firstName =
      "PrefixTestStudent";

    await db.user.save([
      applicationWithApprovedApplicationOfferingChange.student.user,
      applicationWithApprovedApplicationOfferingChangeForDifferentLocation
        .student.user,
      applicationWithDeclinedBySABCApplicationOfferingChange.student.user,
    ]);

    // Here there will be multiple search results with the default order of application number, so setting the application number in order to predict the order while assert.
    applicationWithApprovedApplicationOfferingChange.applicationNumber =
      "2000000000";
    applicationWithDeclinedBySABCApplicationOfferingChange.applicationNumber =
      "9000000000";

    await db.application.save([
      applicationWithApprovedApplicationOfferingChange,
      applicationWithDeclinedBySABCApplicationOfferingChange,
    ]);

    const searchKeyword = "TestStudent";
    const endpoint = `/institutions/location/${collegeFLocation.id}/application-offering-change-request/completed?page=0&pageLimit=10&searchCriteria=${searchKeyword}`;
    console.log(endpoint);
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
            studyStartDate:
              applicationWithApprovedApplicationOfferingChange.currentAssessment
                .offering.studyStartDate,
            studyEndDate:
              applicationWithApprovedApplicationOfferingChange.currentAssessment
                .offering.studyEndDate,
            fullName: getUserFullName(
              applicationWithApprovedApplicationOfferingChange.student.user,
            ),
            status:
              approvedApplicationOfferingChange.applicationOfferingChangeRequestStatus,
            dateCompleted:
              approvedApplicationOfferingChange.assessedDate.toISOString(),
          },
          {
            applicationNumber:
              applicationWithDeclinedBySABCApplicationOfferingChange.applicationNumber,
            studyStartDate:
              applicationWithDeclinedBySABCApplicationOfferingChange
                .currentAssessment.offering.studyStartDate,
            studyEndDate:
              applicationWithDeclinedBySABCApplicationOfferingChange
                .currentAssessment.offering.studyEndDate,
            fullName: getUserFullName(
              applicationWithDeclinedBySABCApplicationOfferingChange.student
                .user,
            ),
            status:
              declinedBySABCApplicationOfferingChange.applicationOfferingChangeRequestStatus,
            dateCompleted:
              declinedBySABCApplicationOfferingChange.assessedDate.toISOString(),
          },
        ],
        count: 2,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
