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
    // Student 2 has an in-progress with student application offering a change request for the institution.
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
          applicationOfferingChangeRequestStatus:
            ApplicationOfferingChangeRequestStatus.Approved,
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
          applicationOfferingChangeRequestStatus:
            ApplicationOfferingChangeRequestStatus.DeclinedByStudent,
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
          applicationOfferingChangeRequestStatus:
            ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
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
      "1000000000";
    applicationWithDeclinedByStudentApplicationOfferingChange.applicationNumber =
      "1000000001";
    applicationWithDeclinedBySABCApplicationOfferingChange.applicationNumber =
      "1000000002";

    await db.application.save([
      applicationWithApprovedApplicationOfferingChange,
      applicationWithDeclinedByStudentApplicationOfferingChange,
      applicationWithDeclinedBySABCApplicationOfferingChange,
    ]);

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
          applicationOfferingChangeRequestStatus:
            ApplicationOfferingChangeRequestStatus.Approved,
        },
      );
    // Student 2 has an approved with student application offering change request with a different institution.
    const approvedApplicationOfferingChangeForDifferentLocation =
      await saveFakeApplicationOfferingRequestChange(db, undefined, {
        applicationOfferingChangeRequestStatus:
          ApplicationOfferingChangeRequestStatus.Approved,
      });
    // Student 3 has a declined by student application offering change request.
    await saveFakeApplicationOfferingRequestChange(
      db,
      {
        institutionLocation: collegeFLocation,
      },
      {
        applicationOfferingChangeRequestStatus:
          ApplicationOfferingChangeRequestStatus.DeclinedByStudent,
      },
    );
    // Student 4 has a declined by SABC offering change request.
    await saveFakeApplicationOfferingRequestChange(
      db,
      {
        institutionLocation: collegeFLocation,
      },
      {
        applicationOfferingChangeRequestStatus:
          ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
      },
    );

    approvedApplicationOfferingChange.assessedDate = new Date();

    await db.applicationOfferingChangeRequest.save(
      approvedApplicationOfferingChange,
    );

    const applicationWithApprovedApplicationOfferingChange =
      approvedApplicationOfferingChange.application;
    const applicationWithApprovedApplicationOfferingChangeForDifferentLocation =
      approvedApplicationOfferingChangeForDifferentLocation.application;

    applicationWithApprovedApplicationOfferingChange.student.user.firstName =
      "TestStudent";
    // Student 2 belong to different institution but have same name.
    applicationWithApprovedApplicationOfferingChangeForDifferentLocation.student.user.firstName =
      "TestStudent";

    await db.user.save([
      applicationWithApprovedApplicationOfferingChange.student.user,
      applicationWithApprovedApplicationOfferingChangeForDifferentLocation
        .student.user,
    ]);

    const endpoint = `/institutions/location/${collegeFLocation.id}/application-offering-change-request/completed?page=0&pageLimit=10&searchCriteria=${applicationWithApprovedApplicationOfferingChange.student.user.firstName}`;
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
        count: 1,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
