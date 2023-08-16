import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAuthRelatedEntities,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import {
  createFakeInstitutionLocation,
  E2EDataSources,
  createE2EDataSources,
  saveFakeApplicationOfferingRequestChange,
} from "@sims/test-utils";
import {
  ApplicationOfferingChangeRequestStatus,
  InstitutionLocation,
} from "@sims/sims-db";
import { FieldSortOrder, getISODateOnlyString } from "@sims/utilities";
import { getUserFullName } from "../../../../utilities";

describe("ApplicationOfferingChangeRequestAESTController(e2e)-getAllInProgressApplications", () => {
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
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
  });

  it("Should return all in progress application offering change requests when requested.", async () => {
    // Arrange

    // Student 1 has an in progress with student application offering change request for College F.
    const inProgressWithStudentApplicationOfferingChange =
      await saveFakeApplicationOfferingRequestChange(db, {
        institutionLocation: collegeFLocation,
      });
    // Student 2 has an in progress with SABC application offering change request for College F.
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
    // Student 3 has an in progress with student application offering change request with a different institution.
    const inProgressWithStudentApplicationOfferingChangeWithDifferentInstitution =
      await saveFakeApplicationOfferingRequestChange(db);
    // Student 4 has an completed application for College F, that has an approved application offering change request.
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

    const applicationApprovedApplicationOfferingChange =
      approvedApplicationOfferingChange.application;
    const applicationInProgressWithStudentApplicationOfferingChangeWithDifferentInstitution =
      inProgressWithStudentApplicationOfferingChangeWithDifferentInstitution.application;
    const applicationWithInProgressWithStudentApplicationOfferingChange =
      inProgressWithStudentApplicationOfferingChange.application;
    const applicationWithInProgressWithSABCApplicationOfferingChange =
      inProgressWithSABCApplicationOfferingChange.application;

    applicationApprovedApplicationOfferingChange.student.user.firstName =
      "Ministry Offering Change Test 1";
    applicationInProgressWithStudentApplicationOfferingChangeWithDifferentInstitution.student.user.firstName =
      "Ministry Offering Change Test 2";
    applicationWithInProgressWithStudentApplicationOfferingChange.student.user.firstName =
      "Ministry Offering Change Test 3";
    applicationWithInProgressWithSABCApplicationOfferingChange.student.user.firstName =
      "Ministry Offering Change Test 4";

    await db.user.save([
      applicationApprovedApplicationOfferingChange.student.user,
      applicationInProgressWithStudentApplicationOfferingChangeWithDifferentInstitution
        .student.user,
      applicationWithInProgressWithStudentApplicationOfferingChange.student
        .user,
      applicationWithInProgressWithSABCApplicationOfferingChange.student.user,
    ]);

    const endpoint = `/aest/application-offering-change-request/in-progress?page=0&pageLimit=10&sortField=status&sortOrder=${FieldSortOrder.DESC}&searchCriteria=Ministry Offering Change Test`;

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
              applicationWithInProgressWithSABCApplicationOfferingChange.applicationNumber,
            applicationId:
              applicationWithInProgressWithSABCApplicationOfferingChange.id,
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
            createdAt: getISODateOnlyString(
              applicationWithInProgressWithSABCApplicationOfferingChange.createdAt,
            ),
            studentId:
              applicationWithInProgressWithSABCApplicationOfferingChange.student
                .id,
          },
          {
            id: inProgressWithStudentApplicationOfferingChangeWithDifferentInstitution.id,
            applicationNumber:
              applicationInProgressWithStudentApplicationOfferingChangeWithDifferentInstitution.applicationNumber,
            applicationId:
              applicationInProgressWithStudentApplicationOfferingChangeWithDifferentInstitution.id,
            studyStartDate:
              applicationInProgressWithStudentApplicationOfferingChangeWithDifferentInstitution
                .currentAssessment.offering.studyStartDate,
            studyEndDate:
              applicationInProgressWithStudentApplicationOfferingChangeWithDifferentInstitution
                .currentAssessment.offering.studyEndDate,
            fullName: getUserFullName(
              applicationInProgressWithStudentApplicationOfferingChangeWithDifferentInstitution
                .student.user,
            ),
            status:
              inProgressWithStudentApplicationOfferingChangeWithDifferentInstitution.applicationOfferingChangeRequestStatus,
            createdAt: getISODateOnlyString(
              applicationInProgressWithStudentApplicationOfferingChangeWithDifferentInstitution.createdAt,
            ),
            studentId:
              applicationInProgressWithStudentApplicationOfferingChangeWithDifferentInstitution
                .student.id,
          },
          {
            id: inProgressWithStudentApplicationOfferingChange.id,
            applicationNumber:
              applicationWithInProgressWithStudentApplicationOfferingChange.applicationNumber,
            applicationId:
              applicationWithInProgressWithStudentApplicationOfferingChange.id,
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
            createdAt: getISODateOnlyString(
              applicationWithInProgressWithStudentApplicationOfferingChange.createdAt,
            ),
            studentId:
              applicationWithInProgressWithStudentApplicationOfferingChange
                .student.id,
          },
        ],
        count: 3,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
