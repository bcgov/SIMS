import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource, Repository } from "typeorm";
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
  saveFakeStudent,
  saveFakeApplicationDisbursements,
} from "@sims/test-utils";
import { Application, Institution, InstitutionLocation } from "@sims/sims-db";

describe("AssessmentInstitutionsController(e2e)-getAssessmentNOA", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let applicationRepo: Repository<Application>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    // College F.
    const { institution: collegeF } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFLocation = createFakeInstitutionLocation(collegeF);
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
    applicationRepo = appDataSource.getRepository(Application);
  });

  it("Should get the student noa details for an eligible application when an eligible public institution user tries to access it.", async () => {
    // Arrange

    // Student has an application to the institution eligible for NOA.
    const student = await saveFakeStudent(appDataSource);

    const application = await saveFakeApplicationDisbursements(appDataSource, {
      institution: collegeF,
      institutionLocation: collegeFLocation,
      student,
    });
    const assessment = application.currentAssessment;

    const endpoint = `/institutions/student/${student.id}/assessment/${assessment.id}/noa`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        applicationStatus: application.applicationStatus,
        // todo ann
        assessment: {
          alimonyOrChildSupport: 0,
          booksAndSuppliesCost: 60000,
          childcareCost: 0,
          exceptionalEducationCost: 60000,
          federalAssessmentNeed: 780000,
          livingAllowance: 1672,
          otherAllowableCost: 0,
          parentAssessedContribution: null,
          partnerAssessedContribution: null,
          provincialAssessmentNeed: 780171.8557692308,
          secondResidenceCost: 0,
          studentTotalFederalContribution: 1500.1442307692307,
          studentTotalProvincialContribution: 1500.1442307692307,
          totalAssessedCost: 781672,
          totalAssessmentNeed: 1560343.7115384615,
          totalFamilyIncome: 1233,
          totalFederalAward: 27200,
          totalFederalContribution: null,
          totalProvincialAward: 312068.7423076923,
          totalProvincialContribution: null,
          transportationCost: 0,
          tuitionCost: 660000,
          weeks: 52,
        },
        disbursement: {
          disbursement1COEStatus: "Completed",
          disbursement1Date: "May 17 2023",
          disbursement1Id: 755,
          disbursement1MSFAACancelledDate: null,
          disbursement1MSFAADateSigned: null,
          disbursement1MSFAAId: 164,
          disbursement1MSFAANumber: "XXXXXXXXXX",
          disbursement1Status: "Pending",
          disbursement1TuitionRemittance: 0,
          disbursement1bcsl: 312069,
          disbursement1csgf: 9000,
          disbursement1cslf: 18200,
        },
        fullName: "ANN JACOB",
        locationName: "Victoria College",
        noaApprovalStatus: "Completed",
        offeringIntensity: "Full Time",
        offeringStudyEndDate: "Jul 31 2023",
        offeringStudyStartDate: "Aug 01 2022",
        programName: "Ann Program",
      });
  });

  // it("Should throw forbidden error when the institution type is not BC Public.", async () => {
  //   // Arrange
  //   // Student submitting an application to College C.
  //   const { student, collegeCApplication } =
  //     await saveStudentApplicationForCollegeC(appDataSource);

  //   await authorizeUserTokenForLocation(
  //     appDataSource,
  //     InstitutionTokenTypes.CollegeCUser,
  //     collegeCApplication.location,
  //   );

  //   // College C is not a BC Public institution.
  //   const collegeCInstitutionUserToken = await getInstitutionToken(
  //     InstitutionTokenTypes.CollegeCUser,
  //   );

  //   const endpoint = `/institutions/student/${student.id}/application-summary?page=0&pageLimit=10&sortField=applicationNumber&sortOrder=${FieldSortOrder.DESC}`;

  //   // Act/Assert
  //   await request(app.getHttpServer())
  //     .get(endpoint)
  //     .auth(collegeCInstitutionUserToken, BEARER_AUTH_TYPE)
  //     .expect(HttpStatus.FORBIDDEN)
  //     .expect({
  //       statusCode: HttpStatus.FORBIDDEN,
  //       message: INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
  //       error: "Forbidden",
  //     });
  // });

  // it("Should throw forbidden error when student does not have at least one application submitted for the institution.", async () => {
  //   // Arrange
  //   const student = await saveFakeStudent(appDataSource);

  //   // College F is a BC Public institution.
  //   const institutionUserToken = await getInstitutionToken(
  //     InstitutionTokenTypes.CollegeFUser,
  //   );

  //   const endpoint = `/institutions/student/${student.id}/application-summary?page=0&pageLimit=10&sortField=applicationNumber&sortOrder=${FieldSortOrder.DESC}`;

  //   // Act/Assert
  //   await request(app.getHttpServer())
  //     .get(endpoint)
  //     .auth(institutionUserToken, BEARER_AUTH_TYPE)
  //     .expect(HttpStatus.FORBIDDEN)
  //     .expect({
  //       statusCode: HttpStatus.FORBIDDEN,
  //       message: INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
  //       error: "Forbidden",
  //     });
  // });

  afterAll(async () => {
    await app?.close();
  });
});
