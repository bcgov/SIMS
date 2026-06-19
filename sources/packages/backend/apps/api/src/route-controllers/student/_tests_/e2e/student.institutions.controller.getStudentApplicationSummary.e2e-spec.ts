import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import { Repository } from "typeorm";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
  INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
  INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
  getRecentActiveProgramYear,
} from "../../../../testHelpers";
import {
  createFakeInstitutionLocation,
  saveFakeStudent,
  saveFakeApplication,
  createE2EDataSources,
  E2EDataSources,
} from "@sims/test-utils";
import {
  Application,
  ApplicationStatus,
  Institution,
  InstitutionLocation,
  ProgramYear,
} from "@sims/sims-db";
import { FieldSortOrder } from "@sims/utilities";
import { saveStudentApplicationForCollegeC } from "./student.institutions.utils";
import { TestingModule } from "@nestjs/testing";

describe("StudentInstitutionsController(e2e)-getStudentApplicationSummary", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let appModule: TestingModule;
  let collegeE: Institution;
  let collegeELocation: InstitutionLocation;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let applicationRepo: Repository<Application>;
  let recentActiveProgramYear: ProgramYear;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    appModule = module;
    // College E.
    const { institution: institutionE } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeEAdminNonLegalSigningUser,
    );
    collegeE = institutionE;
    collegeELocation = createFakeInstitutionLocation({ institution: collegeE });

    // College F.
    const { institution: institutionF } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeF = institutionF;
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
    applicationRepo = db.dataSource.getRepository(Application);
    recentActiveProgramYear = await getRecentActiveProgramYear(db);
  });

  it("Should get the application summary when the student has a submitted application for the institution with a single version.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);

    // Submitted application for College F.
    const savedApplication = await saveFakeApplication(
      db.dataSource,
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      },
      {
        applicationStatus: ApplicationStatus.Submitted,
      },
    );

    const endpoint = `/institutions/student/${student.id}/application-summary?page=0&pageLimit=10`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.results).toEqual([
          {
            id: savedApplication.id,
            applicationNumber: savedApplication.applicationNumber,
            isArchived: false,
            studyStartPeriod:
              savedApplication.currentAssessment?.offering?.studyStartDate,
            studyEndPeriod:
              savedApplication.currentAssessment?.offering?.studyEndDate,
            status: savedApplication.applicationStatus,
            parentApplicationId: savedApplication.id,
            submittedDate: savedApplication.submittedDate?.toISOString(),
            lastSubmittedDate: savedApplication.submittedDate?.toISOString(),
            isChangeRequestAllowedForPY: false,
            offeringIntensity: savedApplication.offeringIntensity,
          },
        ]);
        expect(body.count).toEqual(1);
      });
  });

  it("Should get the application summary when the student has a submitted application for the institution with multiple versions.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);

    // Edited application for College F.
    const editedApplication = await saveFakeApplication(
      db.dataSource,
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      },
      { applicationStatus: ApplicationStatus.Edited },
    );

    // Submitted application for College F.
    const submittedApplication = await saveFakeApplication(
      db.dataSource,
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
        parentApplication: editedApplication,
        precedingApplication: editedApplication,
      },
      {
        applicationStatus: ApplicationStatus.Submitted,
      },
    );

    const endpoint = `/institutions/student/${student.id}/application-summary?page=0&pageLimit=10`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.results).toEqual([
          {
            id: submittedApplication.id,
            applicationNumber: submittedApplication.applicationNumber,
            isArchived: false,
            studyStartPeriod:
              submittedApplication.currentAssessment?.offering?.studyStartDate,
            studyEndPeriod:
              submittedApplication.currentAssessment?.offering?.studyEndDate,
            status: submittedApplication.applicationStatus,
            parentApplicationId: editedApplication.id,
            submittedDate: editedApplication.submittedDate?.toISOString(),
            lastSubmittedDate:
              submittedApplication.submittedDate?.toISOString(),
            isChangeRequestAllowedForPY: false,
            offeringIntensity: submittedApplication.offeringIntensity,
          },
        ]);
        expect(body.count).toEqual(1);
      });
  });

  it("Should get the application summary when the student has a submitted application and a draft application for the institution", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);

    // Draft application for College F.
    await saveFakeApplication(
      db.dataSource,
      {
        student,
      },
      { applicationStatus: ApplicationStatus.Draft },
    );

    // Submitted application for College F.
    const submittedApplication = await saveFakeApplication(
      db.dataSource,
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      },
      {
        applicationStatus: ApplicationStatus.Submitted,
      },
    );

    const endpoint = `/institutions/student/${student.id}/application-summary?page=0&pageLimit=10`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.results).toEqual([
          {
            id: submittedApplication.id,
            applicationNumber: submittedApplication.applicationNumber,
            isArchived: false,
            studyStartPeriod:
              submittedApplication.currentAssessment?.offering?.studyStartDate,
            studyEndPeriod:
              submittedApplication.currentAssessment?.offering?.studyEndDate,
            status: submittedApplication.applicationStatus,
            parentApplicationId: submittedApplication.id,
            submittedDate: submittedApplication.submittedDate?.toISOString(),
            lastSubmittedDate:
              submittedApplication.submittedDate?.toISOString(),
            isChangeRequestAllowedForPY: false,
            offeringIntensity: submittedApplication.offeringIntensity,
          },
        ]);
        expect(body.count).toEqual(1);
      });
  });

  it("Should get the application summary when the student has a submitted application for the institution and another submitted application for another institution.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);

    // Submitted application for College F.
    const collegeFApplication = await saveFakeApplication(db.dataSource, {
      institution: collegeF,
      institutionLocation: collegeFLocation,
      student,
    });

    // Submitted application for College E.
    await saveFakeApplication(db.dataSource, {
      institutionLocation: collegeELocation,
      student,
    });

    const endpoint = `/institutions/student/${student.id}/application-summary?page=0&pageLimit=10`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.results).toEqual([
          {
            id: collegeFApplication.id,
            applicationNumber: collegeFApplication.applicationNumber,
            isArchived: false,
            studyStartPeriod:
              collegeFApplication.currentAssessment?.offering?.studyStartDate,
            studyEndPeriod:
              collegeFApplication.currentAssessment?.offering?.studyEndDate,
            status: collegeFApplication.applicationStatus,
            parentApplicationId: collegeFApplication.id,
            submittedDate: collegeFApplication.submittedDate?.toISOString(),
            lastSubmittedDate: collegeFApplication.submittedDate?.toISOString(),
            isChangeRequestAllowedForPY: false,
            offeringIntensity: collegeFApplication.offeringIntensity,
          },
        ]);
        expect(body.count).toEqual(1);
      });
  });

  it("Should get the application summary when the student has an edited application for the institution and a subsequent submitted application for another institution.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);

    // Edited application for College F.
    const collegeFApplication = await saveFakeApplication(
      db.dataSource,
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      },
      {
        applicationStatus: ApplicationStatus.Edited,
      },
    );

    // Submitted application for college E.
    const collegeEApplication = await saveFakeApplication(db.dataSource, {
      institution: collegeE,
      institutionLocation: collegeELocation,
      student,
      parentApplication: collegeFApplication,
      precedingApplication: collegeFApplication,
    });

    const endpoint = `/institutions/student/${student.id}/application-summary?page=0&pageLimit=10`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.results).toEqual([
          {
            id: collegeEApplication.id,
            applicationNumber: collegeEApplication.applicationNumber,
            isArchived: false,
            studyStartPeriod:
              collegeEApplication.currentAssessment?.offering?.studyStartDate,
            studyEndPeriod:
              collegeEApplication.currentAssessment?.offering?.studyEndDate,
            status: collegeEApplication.applicationStatus,
            parentApplicationId: collegeEApplication.parentApplication?.id,
            submittedDate:
              collegeEApplication.parentApplication?.submittedDate?.toISOString(),
            lastSubmittedDate: collegeEApplication.submittedDate?.toISOString(),
            isChangeRequestAllowedForPY: false,
            offeringIntensity: collegeEApplication.offeringIntensity,
          },
        ]);
        expect(body.count).toEqual(1);
      });
  });

  it("Should get the first application when student has two submitted/in progress applications for the institution when pagination is 1.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);

    // Submitted application for college F.
    const savedApplication1 = await saveFakeApplication(db.dataSource, {
      institution: collegeF,
      institutionLocation: collegeFLocation,
      student,
    });

    // In Progress application for college F.
    await saveFakeApplication(
      db.dataSource,
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      },
      { applicationStatus: ApplicationStatus.InProgress },
    );

    // By default the application is sorted by status.
    const endpoint = `/institutions/student/${student.id}/application-summary?page=0&pageLimit=1`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.results).toEqual([
          {
            id: savedApplication1.id,
            applicationNumber: savedApplication1.applicationNumber,
            isArchived: false,
            studyStartPeriod:
              savedApplication1.currentAssessment?.offering?.studyStartDate,
            studyEndPeriod:
              savedApplication1.currentAssessment?.offering?.studyEndDate,
            status: savedApplication1.applicationStatus,
            parentApplicationId: savedApplication1.id,
            submittedDate: savedApplication1.submittedDate?.toISOString(),
            lastSubmittedDate: savedApplication1.submittedDate?.toISOString(),
            isChangeRequestAllowedForPY: false,
            offeringIntensity: savedApplication1.offeringIntensity,
          },
        ]);
        expect(body.count).toEqual(2);
      });
  });

  it(
    `Should get both applications in ${FieldSortOrder.DESC} order of application number ` +
      "when the student has two submitted/in progress applications for the institution " +
      `and when sortField is application number and sortOrder is ${FieldSortOrder.DESC}. `,
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);

      // Submitted application for college F.
      const savedApplication1 = await saveFakeApplication(db.dataSource, {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      });

      // In Progress application for college F.
      const savedApplication2 = await saveFakeApplication(
        db.dataSource,
        {
          institution: collegeF,
          institutionLocation: collegeFLocation,
          student,
        },
        { applicationStatus: ApplicationStatus.InProgress },
      );

      savedApplication1.applicationNumber = "1000000000";
      savedApplication2.applicationNumber = "1000000001";
      await applicationRepo.save([savedApplication1, savedApplication2]);

      const endpoint = `/institutions/student/${student.id}/application-summary?page=0&pageLimit=10&sortField=applicationNumber&sortOrder=${FieldSortOrder.DESC}`;
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.results).toEqual([
            {
              id: savedApplication2.id,
              applicationNumber: savedApplication2.applicationNumber,
              isArchived: false,
              studyStartPeriod:
                savedApplication2.currentAssessment?.offering?.studyStartDate,
              studyEndPeriod:
                savedApplication2.currentAssessment?.offering?.studyEndDate,
              status: savedApplication2.applicationStatus,
              parentApplicationId: savedApplication2.id,
              submittedDate: savedApplication2.submittedDate?.toISOString(),
              lastSubmittedDate: savedApplication2.submittedDate?.toISOString(),
              isChangeRequestAllowedForPY: false,
              offeringIntensity: savedApplication2.offeringIntensity,
            },
            {
              id: savedApplication1.id,
              applicationNumber: savedApplication1.applicationNumber,
              isArchived: false,
              studyStartPeriod:
                savedApplication1.currentAssessment?.offering?.studyStartDate,
              studyEndPeriod:
                savedApplication1.currentAssessment?.offering?.studyEndDate,
              status: savedApplication1.applicationStatus,
              parentApplicationId: savedApplication1.id,
              submittedDate: savedApplication1.submittedDate?.toISOString(),
              lastSubmittedDate: savedApplication1.submittedDate?.toISOString(),
              isChangeRequestAllowedForPY: false,
              offeringIntensity: savedApplication1.offeringIntensity,
            },
          ]);
          expect(body.count).toEqual(2);
        });
    },
  );

  it("Should throw forbidden error when the institution type is not BC Public.", async () => {
    // Arrange
    // Student submitting an application to College C.
    const { student, collegeCApplication } =
      await saveStudentApplicationForCollegeC(db.dataSource);

    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCApplication.location,
    );

    // College C is not a BC Public institution.
    const collegeCInstitutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );

    const endpoint = `/institutions/student/${student.id}/application-summary?page=0&pageLimit=10&sortField=applicationNumber&sortOrder=${FieldSortOrder.DESC}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(collegeCInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect(({ body }) => {
        expect(body).toEqual({
          statusCode: HttpStatus.FORBIDDEN,
          message: INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
          error: "Forbidden",
        });
      });
  });

  it("Should throw forbidden error when student does not have at least one application submitted for the institution.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);

    // College F is a BC Public institution.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/student/${student.id}/application-summary?page=0&pageLimit=10&sortField=applicationNumber&sortOrder=${FieldSortOrder.DESC}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect(({ body }) => {
        expect(body).toEqual({
          statusCode: HttpStatus.FORBIDDEN,
          message: INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
          error: "Forbidden",
        });
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
