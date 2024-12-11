import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeDisbursementFeedbackError,
  createFakeDisbursementValue,
  createFakeEducationProgramOffering,
  createFakeInstitutionLocation,
  createFakeUser,
  getProviderInstanceForModule,
  saveFakeApplicationDisbursements,
  saveFakeCASSupplier,
  saveFakeDesignationAgreementLocation,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { parse } from "papaparse";
import * as request from "supertest";
import { FormNames, FormService } from "../../../../services";
import { AppAESTModule } from "../../../../app.aest.module";
import { TestingModule } from "@nestjs/testing";
import {
  ApplicationData,
  ApplicationStatus,
  Assessment,
  COEStatus,
  DisbursementScheduleStatus,
  DisbursementValueType,
  EducationProgram,
  EducationProgramOffering,
  FullTimeAssessment,
  IdentityProviders,
  InstitutionLocation,
  OfferingIntensity,
  ProgramIntensity,
  Student,
  SupplierStatus,
  WorkflowData,
} from "@sims/sims-db";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { DataSource } from "typeorm";
import { createFakeEducationProgram } from "@sims/test-utils/factories/education-program";
import { createFakeSINValidation } from "@sims/test-utils/factories/sin-validation";
import { getPSTPDTDateFormatted } from "@sims/test-utils/utils";

describe("ReportAestController(e2e)-exportReport", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let appDataSource: DataSource;
  let formService: FormService;
  let sharedCASSupplierUpdatedStudent: Student;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    appDataSource = dataSource;
    db = createE2EDataSources(dataSource);
    // Mock the form service to validate the dry-run submission result.
    formService = await getProviderInstanceForModule(
      appModule,
      AppAESTModule,
      FormService,
    );
    // Shared student used for CAS Supplier maintenance updates report.
    sharedCASSupplierUpdatedStudent = await saveFakeStudent(db.dataSource);
  });

  it("Should generate the eCert Feedback Errors report when a report generation request is made with the appropriate offering intensity and date range.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      undefined,
      {
        applicationStatus: ApplicationStatus.Completed,
        offeringIntensity: OfferingIntensity.partTime,
        firstDisbursementInitialValues: {
          coeStatus: COEStatus.completed,
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        },
      },
    );
    const [firstDisbursement] =
      application.currentAssessment.disbursementSchedules;
    // Feedback error sample.
    const eCertFeedbackError = await db.eCertFeedbackError.findOne({
      select: { id: true, errorCode: true },
      where: {
        offeringIntensity: OfferingIntensity.partTime,
      },
    });
    // Create fake Disbursement Feedback Error.
    const fakeDisbursementFeedbackError =
      await db.disbursementFeedbackErrors.save(
        createFakeDisbursementFeedbackError(
          {
            disbursementSchedule: firstDisbursement,
            eCertFeedbackError: eCertFeedbackError,
          },
          {
            initialValues: {
              dateReceived: new Date("2024-01-01"),
              feedbackFileName: "FEEDBACK_FILENAME.txt",
            },
          },
        ),
      );
    const payload = {
      reportName: "ECert_Errors_Report",
      params: {
        offeringIntensity: {
          "Full Time": false,
          "Part Time": true,
        },
        startDate: "2023-10-01",
        endDate: "2024-10-01",
      },
    };
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: FormNames.ExportFinancialReports,
      data: { data: payload },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    const endpoint = "/aest/report";
    const ministryUserToken = await getAESTToken(
      AESTGroups.BusinessAdministrators,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(ministryUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        const fileContent = response.request.res["text"];
        const parsedResult = parse(fileContent, {
          header: true,
        });
        const studentAssessment = firstDisbursement.studentAssessment;
        const offering = studentAssessment.offering;
        const fakeApplication = studentAssessment.application;
        const student = fakeApplication.student;
        const user = student.user;
        expect(parsedResult.data).toEqual(
          expect.arrayContaining([
            {
              "eCert Number": firstDisbursement.documentNumber.toString(),
              "Application Number": fakeApplication.applicationNumber,
              "First Name": user.firstName,
              "Last Name": user.lastName,
              "Date of Birth": getISODateOnlyString(student.birthDate),
              "Feedback File Name":
                fakeDisbursementFeedbackError.feedbackFileName,
              "Study Start Date": getISODateOnlyString(offering.studyStartDate),
              "Study End Date": getISODateOnlyString(offering.studyEndDate),
              "Error Logged Date": getISODateOnlyString(
                fakeDisbursementFeedbackError.dateReceived,
              ),
              "Error Codes": eCertFeedbackError.errorCode,
            },
          ]),
        );
      });
  });

  it("Should generate the Institution Designation report when a report generation request is made with the appropriate date range filters.", async () => {
    // Arrange
    const designationAgreement = await saveFakeDesignationAgreementLocation(
      db,
      {
        numberOfLocations: 2,
        initialValues: {
          endDate: getISODateOnlyString(addDays(30, new Date())),
        },
      },
    );
    const [
      approvedDesignationAgreementLocation,
      declinedDesignationAgreementLocation,
    ] = designationAgreement.designationAgreementLocations;
    declinedDesignationAgreementLocation.approved = false;
    await db.designationAgreementLocation.save(
      declinedDesignationAgreementLocation,
    );
    const designatedInstitutionLocation =
      approvedDesignationAgreementLocation.institutionLocation;
    const nonDesignatedInstitutionLocation =
      declinedDesignationAgreementLocation.institutionLocation;
    const designatedPrimaryContact =
      designatedInstitutionLocation.primaryContact;
    const nonDesignatedPrimaryContact =
      nonDesignatedInstitutionLocation.primaryContact;
    const payload = {
      reportName: "Institution_Designation_Report",
      params: {
        startDate: new Date(),
        endDate: addDays(31, new Date()),
      },
    };
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: FormNames.ExportFinancialReports,
      data: { data: payload },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    const endpoint = "/aest/report";
    const ministryUserToken = await getAESTToken(
      AESTGroups.BusinessAdministrators,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(ministryUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        const fileContent = response.request.res["text"];
        const parsedResult = parse(fileContent, {
          header: true,
        });
        expect(parsedResult.data).toEqual(
          expect.arrayContaining([
            {
              "Institution Operating Name":
                designatedInstitutionLocation.institution.operatingName,
              "Location Name": designatedInstitutionLocation.name,
              "Location Code": designatedInstitutionLocation.institutionCode,
              "Institution Type": "BC Private",
              "Designation Status": designationAgreement.designationStatus,
              "Assessed Date": "",
              "Expiry Date": designationAgreement.endDate,
              "Request for designation":
                approvedDesignationAgreementLocation.requested.toString(),
              "Approved for designation":
                approvedDesignationAgreementLocation.approved.toString(),
              "Location Contact":
                designatedPrimaryContact.firstName +
                " " +
                designatedPrimaryContact.lastName,
              "Contact Email": designatedPrimaryContact.email,
            },
            {
              "Institution Operating Name":
                nonDesignatedInstitutionLocation.institution.operatingName,
              "Location Name": nonDesignatedInstitutionLocation.name,
              "Location Code": nonDesignatedInstitutionLocation.institutionCode,
              "Institution Type": "BC Private",
              "Designation Status": designationAgreement.designationStatus,
              "Assessed Date": "",
              "Expiry Date": designationAgreement.endDate,
              "Request for designation":
                declinedDesignationAgreementLocation.requested.toString(),
              "Approved for designation":
                declinedDesignationAgreementLocation.approved.toString(),
              "Location Contact":
                nonDesignatedPrimaryContact.firstName +
                " " +
                nonDesignatedPrimaryContact.lastName,
              "Contact Email": nonDesignatedPrimaryContact.email,
            },
          ]),
        );
      });
  });

  it(
    "Should generate the Program and Offering Status report when a report generation is made with the appropriate date range filters " +
      "for an institution with one location and without any education program or offering.",
    async () => {
      // Arrange
      const institutionLocation = createFakeInstitutionLocation();

      // Payload with both full time and part time options being checked
      const payload = {
        reportName: "Program_And_Offering_Status_Report",
        params: {
          institution: institutionLocation.institution.id,
          startDate: getISODateOnlyString(new Date()),
          endDate: getISODateOnlyString(new Date()),
          offeringIntensity: {
            "Full Time": true,
            "Part Time": true,
          },
          sabcProgramCode: "",
        },
      };
      const dryRunSubmissionMockFullTimeOnly = jest.fn().mockResolvedValue({
        valid: true,
        formName: FormNames.ExportFinancialReports,
        data: { data: payload },
      });
      formService.dryRunSubmission = dryRunSubmissionMockFullTimeOnly;
      const endpoint = "/aest/report";
      const ministryUserToken = await getAESTToken(
        AESTGroups.BusinessAdministrators,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .auth(ministryUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          const fileContent = response.request.res["text"];
          const parsedResult = parse(fileContent, {
            header: true,
          });
          expect(parsedResult.data).toEqual([]);
        });
    },
  );

  it(
    "Should generate the Program and Offering Status report when a report generation is made with the appropriate date range filters and only the full time option is considered " +
      "for an institution with one location and three education programs of different program intensities having offerings of different intensities and one program without offerings.",
    async () => {
      // Arrange
      const auditUser = await db.user.save(createFakeUser());
      const institutionLocation = createFakeInstitutionLocation();
      // Create an education program with full time program intensity
      // and one full time offering associated with the program.
      const fakeOfferingFullTime1 = createFakeEducationProgramOffering(
        { auditUser, institutionLocation },
        {
          initialValues: { offeringIntensity: OfferingIntensity.fullTime },
          programInitialValues: {
            programIntensity: ProgramIntensity.fullTime,
            deliveredOnSite: true,
          },
        },
      );

      // Create an education program with full time and part time program intensity
      // and one full time offering and two part time offerings whose study start date
      // and end date are within the search date range.
      const fakeOfferingFullTime2 = createFakeEducationProgramOffering(
        {
          auditUser,
          institutionLocation,
        },
        {
          initialValues: {
            offeringIntensity: OfferingIntensity.fullTime,
            studyStartDate: getISODateOnlyString(
              addDays(1, fakeOfferingFullTime1.studyStartDate),
            ),
            studyEndDate: getISODateOnlyString(
              addDays(1, fakeOfferingFullTime1.studyEndDate),
            ),
          },
          programInitialValues: {
            programIntensity: ProgramIntensity.fullTimePartTime,
            deliveredOnSite: true,
          },
        },
      );
      const fakeOfferingPartTime1 = createFakeEducationProgramOffering(
        {
          auditUser,
          institutionLocation,
          program: fakeOfferingFullTime2.educationProgram,
        },
        {
          initialValues: {
            offeringIntensity: OfferingIntensity.partTime,
            studyStartDate: getISODateOnlyString(
              addDays(1, fakeOfferingFullTime2.studyStartDate),
            ),
            studyEndDate: getISODateOnlyString(
              addDays(1, fakeOfferingFullTime2.studyEndDate),
            ),
          },
        },
      );

      // Create an education program with full time and part time program intensity
      // and one part time offering whose study start date and end date are outside
      // the search date range.
      const fakeOfferingPartTime2 = createFakeEducationProgramOffering(
        {
          auditUser,
          institutionLocation,
        },
        {
          initialValues: {
            offeringIntensity: OfferingIntensity.partTime,
            studyStartDate: getISODateOnlyString(
              addDays(1, fakeOfferingPartTime1.studyStartDate),
            ),
            studyEndDate: getISODateOnlyString(
              addDays(1, fakeOfferingPartTime1.studyEndDate),
            ),
          },
          programInitialValues: {
            programIntensity: ProgramIntensity.fullTimePartTime,
            deliveredOnSite: true,
          },
        },
      );

      // Create an education program with full time program intensity without any offering.
      const fakeProgram = createFakeEducationProgram(
        {
          auditUser,
          institution: institutionLocation.institution,
        },
        {
          initialValues: {
            programIntensity: ProgramIntensity.fullTime,
            deliveredOnSite: true,
          },
        },
      );
      await db.educationProgram.save(fakeProgram);
      await db.educationProgramOffering.save([
        fakeOfferingFullTime1,
        fakeOfferingFullTime2,
        fakeOfferingPartTime1,
        fakeOfferingPartTime2,
      ]);

      const ProgramAndOfferingStatusReport =
        "Program_And_Offering_Status_Report";
      const endpoint = "/aest/report";
      const ministryUserToken = await getAESTToken(
        AESTGroups.BusinessAdministrators,
      );

      // Payload with only full time option being checked.
      const payloadFullTimeOnly = {
        reportName: ProgramAndOfferingStatusReport,
        params: {
          institution: institutionLocation.institution.id,
          startDate: fakeOfferingFullTime1.studyStartDate,
          endDate: getISODateOnlyString(fakeOfferingPartTime2.studyEndDate),
          offeringIntensity: {
            "Full Time": true,
            "Part Time": false,
          },
          sabcProgramCode: "",
        },
      };
      const dryRunSubmissionMockFullTimeOnly = jest.fn().mockResolvedValue({
        valid: true,
        formName: FormNames.ExportFinancialReports,
        data: { data: payloadFullTimeOnly },
      });
      formService.dryRunSubmission = dryRunSubmissionMockFullTimeOnly;

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payloadFullTimeOnly)
        .auth(ministryUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          const fileContent = response.request.res["text"];
          const parsedResult = parse(fileContent, {
            header: true,
          });
          expect(parsedResult.data).toEqual(
            expect.arrayContaining([
              offeringToResultData(fakeOfferingFullTime1),
              programToResultData(fakeProgram, institutionLocation),
            ]),
          );
        });
    },
  );

  it(
    "Should generate the Program and Offering Status report when a report generation is made with the appropriate date range filters and only the part time option is considered " +
      "for an institution with one location and three education programs of different program intensities having offerings of different intensities and one program without offerings.",
    async () => {
      // Arrange
      const auditUser = await db.user.save(createFakeUser());
      const institutionLocation = createFakeInstitutionLocation();
      // Create an education program with full time program intensity
      // and one full time offering associated with the program.
      const fakeOfferingFullTime1 = createFakeEducationProgramOffering(
        { auditUser, institutionLocation },
        {
          initialValues: { offeringIntensity: OfferingIntensity.fullTime },
          programInitialValues: {
            programIntensity: ProgramIntensity.fullTime,
            deliveredOnSite: true,
          },
        },
      );

      // Create an education program with full time and part time program intensity
      // and one full time offering and two part time offerings whose study start date
      // and end date are within the search date range.
      const fakeOfferingFullTime2 = createFakeEducationProgramOffering(
        {
          auditUser,
          institutionLocation,
        },
        {
          initialValues: {
            offeringIntensity: OfferingIntensity.fullTime,
            studyStartDate: getISODateOnlyString(
              addDays(1, fakeOfferingFullTime1.studyStartDate),
            ),
            studyEndDate: getISODateOnlyString(
              addDays(1, fakeOfferingFullTime1.studyEndDate),
            ),
          },
          programInitialValues: {
            programIntensity: ProgramIntensity.fullTimePartTime,
            deliveredOnSite: true,
          },
        },
      );
      const fakeOfferingPartTime1 = createFakeEducationProgramOffering(
        {
          auditUser,
          institutionLocation,
          program: fakeOfferingFullTime2.educationProgram,
        },
        {
          initialValues: {
            offeringIntensity: OfferingIntensity.partTime,
            studyStartDate: getISODateOnlyString(
              addDays(1, fakeOfferingFullTime2.studyStartDate),
            ),
            studyEndDate: getISODateOnlyString(
              addDays(1, fakeOfferingFullTime2.studyEndDate),
            ),
          },
        },
      );

      // Create an education program with full time and part time program intensity
      // and one part time offering whose study start date and end date are outside
      // the search date range.
      const fakeOfferingPartTime2 = createFakeEducationProgramOffering(
        {
          auditUser,
          institutionLocation,
        },
        {
          initialValues: {
            offeringIntensity: OfferingIntensity.partTime,
            studyStartDate: getISODateOnlyString(
              addDays(30, fakeOfferingPartTime1.studyStartDate),
            ),
            studyEndDate: getISODateOnlyString(
              addDays(60, fakeOfferingPartTime1.studyEndDate),
            ),
          },
          programInitialValues: {
            programIntensity: ProgramIntensity.fullTimePartTime,
            deliveredOnSite: true,
          },
        },
      );

      // Create an education program with full time and part time program intensity without any offering.
      const fakeProgram = createFakeEducationProgram(
        {
          auditUser,
          institution: institutionLocation.institution,
        },
        {
          initialValues: {
            programIntensity: ProgramIntensity.fullTimePartTime,
            deliveredOnSite: true,
          },
        },
      );
      await db.educationProgram.save(fakeProgram);
      await db.educationProgramOffering.save([
        fakeOfferingFullTime1,
        fakeOfferingFullTime2,
        fakeOfferingPartTime1,
        fakeOfferingPartTime2,
      ]);

      const ProgramAndOfferingStatusReport =
        "Program_And_Offering_Status_Report";
      const endpoint = "/aest/report";
      const ministryUserToken = await getAESTToken(
        AESTGroups.BusinessAdministrators,
      );

      // Payload with only part time option being checked.
      const payloadPartTimeOnly = {
        reportName: ProgramAndOfferingStatusReport,
        params: {
          institution: institutionLocation.institution.id,
          startDate: fakeOfferingFullTime1.studyStartDate,
          endDate: getISODateOnlyString(fakeOfferingPartTime1.studyEndDate),
          offeringIntensity: {
            "Full Time": false,
            "Part Time": true,
          },
          sabcProgramCode: "",
        },
      };
      const dryRunSubmissionMockPartTimeOnly = jest.fn().mockResolvedValue({
        valid: true,
        formName: FormNames.ExportFinancialReports,
        data: { data: payloadPartTimeOnly },
      });
      formService.dryRunSubmission = dryRunSubmissionMockPartTimeOnly;

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payloadPartTimeOnly)
        .auth(ministryUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          const fileContent = response.request.res["text"];
          const parsedResult = parse(fileContent, {
            header: true,
          });
          expect(parsedResult.data).toEqual(
            expect.arrayContaining([
              offeringToResultData(fakeOfferingPartTime1),
              programToResultData(fakeProgram, institutionLocation),
              programToResultData(
                fakeOfferingPartTime2.educationProgram,
                institutionLocation,
              ),
            ]),
          );
        });
    },
  );

  it(
    "Should generate the Program and Offering Status report when a report generation is made with the appropriate date range filters and both full time and part time options are considered " +
      "for an institution with one location and three education programs of different program intensities having offerings of different intensities and one program without offerings.",
    async () => {
      // Arrange
      const auditUser = await db.user.save(createFakeUser());
      const institutionLocation = createFakeInstitutionLocation();
      // Create an education program with full time program intensity
      // and one full time offering associated with the program.
      const fakeOfferingFullTime1 = createFakeEducationProgramOffering(
        { auditUser, institutionLocation },
        {
          initialValues: { offeringIntensity: OfferingIntensity.fullTime },
          programInitialValues: {
            programIntensity: ProgramIntensity.fullTime,
            deliveredOnSite: true,
          },
        },
      );

      // Create an education program with full time and part time program intensity
      // and one full time offering and two part time offerings whose study start date
      // and end date are within the search date range.
      const fakeOfferingFullTime2 = createFakeEducationProgramOffering(
        {
          auditUser,
          institutionLocation,
        },
        {
          initialValues: {
            offeringIntensity: OfferingIntensity.fullTime,
            studyStartDate: getISODateOnlyString(
              addDays(1, fakeOfferingFullTime1.studyStartDate),
            ),
            studyEndDate: getISODateOnlyString(
              addDays(1, fakeOfferingFullTime1.studyEndDate),
            ),
          },
          programInitialValues: {
            programIntensity: ProgramIntensity.fullTimePartTime,
            deliveredOnSite: true,
          },
        },
      );
      const fakeOfferingPartTime1 = createFakeEducationProgramOffering(
        {
          auditUser,
          institutionLocation,
          program: fakeOfferingFullTime2.educationProgram,
        },
        {
          initialValues: {
            offeringIntensity: OfferingIntensity.partTime,
            studyStartDate: getISODateOnlyString(
              addDays(1, fakeOfferingFullTime2.studyStartDate),
            ),
            studyEndDate: getISODateOnlyString(
              addDays(1, fakeOfferingFullTime2.studyEndDate),
            ),
          },
        },
      );

      // Create an education program with full time and part time program intensity and one
      // part time offering whose study start date and end date are within the search date range.
      const fakeOfferingPartTime2 = createFakeEducationProgramOffering(
        {
          auditUser,
          institutionLocation,
        },
        {
          initialValues: {
            offeringIntensity: OfferingIntensity.partTime,
            studyStartDate: getISODateOnlyString(
              addDays(1, fakeOfferingPartTime1.studyStartDate),
            ),
            studyEndDate: getISODateOnlyString(
              addDays(1, fakeOfferingPartTime1.studyEndDate),
            ),
          },
          programInitialValues: {
            programIntensity: ProgramIntensity.fullTimePartTime,
            deliveredOnSite: true,
          },
        },
      );

      // Create an education program with full time and part time program intensity and one
      // part time offering whose study start date and end date are outside the search date range.
      const fakeOfferingPartTime3 = createFakeEducationProgramOffering(
        {
          auditUser,
          institutionLocation,
        },
        {
          initialValues: {
            offeringIntensity: OfferingIntensity.partTime,
            studyStartDate: getISODateOnlyString(
              addDays(30, fakeOfferingPartTime2.studyStartDate),
            ),
            studyEndDate: getISODateOnlyString(
              addDays(60, fakeOfferingPartTime2.studyEndDate),
            ),
          },
          programInitialValues: {
            programIntensity: ProgramIntensity.fullTimePartTime,
            deliveredOnSite: true,
          },
        },
      );

      // Create an education program with full time and part time program intensity without any offering.
      const fakeProgram = createFakeEducationProgram(
        {
          auditUser,
          institution: institutionLocation.institution,
        },
        {
          initialValues: {
            programIntensity: ProgramIntensity.fullTimePartTime,
            deliveredOnSite: true,
          },
        },
      );
      await db.educationProgram.save(fakeProgram);
      await db.educationProgramOffering.save([
        fakeOfferingFullTime1,
        fakeOfferingFullTime2,
        fakeOfferingPartTime1,
        fakeOfferingPartTime2,
        fakeOfferingPartTime3,
      ]);

      const ProgramAndOfferingStatusReport =
        "Program_And_Offering_Status_Report";
      const endpoint = "/aest/report";
      const ministryUserToken = await getAESTToken(
        AESTGroups.BusinessAdministrators,
      );

      // Payload with both full time and part time options being checked.
      const payloadFullTimePartTime = {
        reportName: ProgramAndOfferingStatusReport,
        params: {
          institution: institutionLocation.institution.id,
          startDate: fakeOfferingFullTime1.studyStartDate,
          endDate: getISODateOnlyString(fakeOfferingPartTime2.studyEndDate),
          offeringIntensity: {
            "Full Time": true,
            "Part Time": true,
          },
          sabcProgramCode: "",
        },
      };
      const dryRunSubmissionMockFullTimePartTime = jest.fn().mockResolvedValue({
        valid: true,
        formName: FormNames.ExportFinancialReports,
        data: { data: payloadFullTimePartTime },
      });
      formService.dryRunSubmission = dryRunSubmissionMockFullTimePartTime;

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payloadFullTimePartTime)
        .auth(ministryUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          const fileContent = response.request.res["text"];
          const parsedResult = parse(fileContent, {
            header: true,
          });
          expect(parsedResult.data).toEqual(
            expect.arrayContaining([
              offeringToResultData(fakeOfferingFullTime1),
              offeringToResultData(fakeOfferingFullTime2),
              offeringToResultData(fakeOfferingPartTime1),
              offeringToResultData(fakeOfferingPartTime2),
              programToResultData(fakeProgram, institutionLocation),
              programToResultData(
                fakeOfferingPartTime3.educationProgram,
                institutionLocation,
              ),
            ]),
          );
        });
    },
  );

  it(
    "Should generate the Program and Offering Status report when a report generation is made with the appropriate date range filters and both full time and part time options are considered " +
      "and the SABC code is entered for an institution with one location and three education programs of different program intensities having offerings of different intensities and " +
      "one program without offerings.",
    async () => {
      // Arrange
      const auditUser = await db.user.save(createFakeUser());
      const institutionLocation = createFakeInstitutionLocation();
      // Create an education program with full time program intensity
      // and one full time offering associated with the program.
      const fakeOfferingFullTime1 = createFakeEducationProgramOffering(
        { auditUser, institutionLocation },
        {
          initialValues: { offeringIntensity: OfferingIntensity.fullTime },
          programInitialValues: {
            programIntensity: ProgramIntensity.fullTime,
            deliveredOnSite: true,
            sabcCode: "ABCD",
          },
        },
      );

      // Create an education program with full time and part time program intensity
      // and designated SABC code and one full time offering and two part time offerings
      // whose study start date and end date are within the search date range.
      const fakeOfferingFullTime2 = createFakeEducationProgramOffering(
        {
          auditUser,
          institutionLocation,
        },
        {
          initialValues: {
            offeringIntensity: OfferingIntensity.fullTime,
            studyStartDate: getISODateOnlyString(
              addDays(1, fakeOfferingFullTime1.studyStartDate),
            ),
            studyEndDate: getISODateOnlyString(
              addDays(1, fakeOfferingFullTime1.studyEndDate),
            ),
          },
          programInitialValues: {
            programIntensity: ProgramIntensity.fullTimePartTime,
            deliveredOnSite: true,
            sabcCode: "ABCD",
          },
        },
      );
      const fakeOfferingPartTime1 = createFakeEducationProgramOffering(
        {
          auditUser,
          institutionLocation,
          program: fakeOfferingFullTime2.educationProgram,
        },
        {
          initialValues: {
            offeringIntensity: OfferingIntensity.partTime,
            studyStartDate: getISODateOnlyString(
              addDays(1, fakeOfferingFullTime2.studyStartDate),
            ),
            studyEndDate: getISODateOnlyString(
              addDays(1, fakeOfferingFullTime2.studyEndDate),
            ),
          },
        },
      );

      // Create an education program with full time and part time program intensity
      // and one part time offering whose study start date and end date are within
      // the search date range.
      const fakeOfferingPartTime2 = createFakeEducationProgramOffering(
        {
          auditUser,
          institutionLocation,
        },
        {
          initialValues: {
            offeringIntensity: OfferingIntensity.partTime,
            studyStartDate: getISODateOnlyString(
              addDays(1, fakeOfferingPartTime1.studyStartDate),
            ),
            studyEndDate: getISODateOnlyString(
              addDays(1, fakeOfferingPartTime1.studyEndDate),
            ),
          },
          programInitialValues: {
            programIntensity: ProgramIntensity.fullTimePartTime,
            deliveredOnSite: true,
          },
        },
      );

      // Create an education program with full time and part time program intensity
      // and designated SABC code and one part time offering whose study start date
      // and end date are outside the search date range.
      const fakeOfferingPartTime3 = createFakeEducationProgramOffering(
        {
          auditUser,
          institutionLocation,
        },
        {
          initialValues: {
            offeringIntensity: OfferingIntensity.partTime,
            studyStartDate: getISODateOnlyString(
              addDays(30, fakeOfferingPartTime2.studyStartDate),
            ),
            studyEndDate: getISODateOnlyString(
              addDays(60, fakeOfferingPartTime2.studyEndDate),
            ),
          },
          programInitialValues: {
            programIntensity: ProgramIntensity.fullTimePartTime,
            deliveredOnSite: true,
            sabcCode: "ABCD",
          },
        },
      );

      // Create an education program with full time and part time program intensity
      // and one part time offering whose study start date and end date are outside
      // the search date range.
      const fakeOfferingPartTime4 = createFakeEducationProgramOffering(
        {
          auditUser,
          institutionLocation,
        },
        {
          initialValues: {
            offeringIntensity: OfferingIntensity.partTime,
            studyStartDate: getISODateOnlyString(
              addDays(1, fakeOfferingPartTime2.studyStartDate),
            ),
            studyEndDate: getISODateOnlyString(
              addDays(1, fakeOfferingPartTime2.studyEndDate),
            ),
          },
          programInitialValues: {
            programIntensity: ProgramIntensity.fullTimePartTime,
            deliveredOnSite: true,
          },
        },
      );

      // Create an education program with full time and part time program intensity
      // and designated SABC code without any offering.
      const fakeProgram = createFakeEducationProgram(
        {
          auditUser,
          institution: institutionLocation.institution,
        },
        {
          initialValues: {
            programIntensity: ProgramIntensity.fullTimePartTime,
            deliveredOnSite: true,
            sabcCode: "ABCD",
          },
        },
      );
      await db.educationProgram.save(fakeProgram);
      await db.educationProgramOffering.save([
        fakeOfferingFullTime1,
        fakeOfferingFullTime2,
        fakeOfferingPartTime1,
        fakeOfferingPartTime2,
        fakeOfferingPartTime3,
        fakeOfferingPartTime4,
      ]);

      const ProgramAndOfferingStatusReport =
        "Program_And_Offering_Status_Report";
      const endpoint = "/aest/report";
      const ministryUserToken = await getAESTToken(
        AESTGroups.BusinessAdministrators,
      );

      // Payload with both full time and part time option being checked and SABC code entered.
      const payloadPartTimeOnlySABC = {
        reportName: ProgramAndOfferingStatusReport,
        params: {
          institution: institutionLocation.institution.id,
          startDate: fakeOfferingFullTime1.studyStartDate,
          endDate: getISODateOnlyString(fakeOfferingPartTime2.studyEndDate),
          offeringIntensity: {
            "Full Time": true,
            "Part Time": true,
          },
          sabcProgramCode: "ABCD",
        },
      };
      const dryRunSubmissionMockPartTimeOnlySABC = jest.fn().mockResolvedValue({
        valid: true,
        formName: FormNames.ExportFinancialReports,
        data: { data: payloadPartTimeOnlySABC },
      });
      formService.dryRunSubmission = dryRunSubmissionMockPartTimeOnlySABC;

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payloadPartTimeOnlySABC)
        .auth(ministryUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          const fileContent = response.request.res["text"];
          const parsedResult = parse(fileContent, {
            header: true,
          });
          expect(parsedResult.data).toEqual(
            expect.arrayContaining([
              offeringToResultData(fakeOfferingFullTime1),
              offeringToResultData(fakeOfferingFullTime2),
              offeringToResultData(fakeOfferingPartTime1),
              programToResultData(fakeProgram, institutionLocation),
              programToResultData(
                fakeOfferingPartTime3.educationProgram,
                institutionLocation,
              ),
            ]),
          );
        });
    },
  );

  it("Should generate the Student Unmet Need Report for ministry when a report generation request is made with the appropriate filters.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const now = new Date();
    const savedApplication = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        currentAssessmentInitialValues: {
          workflowData: {
            calculatedData: {
              totalEligibleDependents: 2,
              pdppdStatus: false,
            },
          } as WorkflowData,
          assessmentDate: now,
          assessmentData: {
            totalFederalAssessedResources: 10,
            federalAssessmentNeed: 3,
            totalProvincialAssessedResources: 5,
            provincialAssessmentNeed: 11,
            finalAwardTotal: 20,
            finalFederalAwardNetCSGPAmount: 13,
            finalFederalAwardNetCSGDAmount: 14,
            finalProvincialAwardNetBCAGAmount: 15,
            finalProvincialAwardNetSBSDAmount: 16,
            finalProvincialAwardNetBCSLAmount: 17,
            finalFederalAwardNetCSGFAmount: 18,
            finalProvincialAwardNetBGPDAmount: 19,
            totalAssessedCost: 50,
          } as Assessment,
        },
        applicationData: {
          indigenousStatus: "no",
          citizenship: "canadianCitizen",
          youthInCare: "no",
          dependantstatus: "independant",
        } as ApplicationData,
        offeringInitialValues: {
          studyStartDate: getISODateOnlyString(now),
          studyEndDate: getISODateOnlyString(addDays(30, now)),
        },
      },
    );
    const payload = {
      reportName: "Ministry_Student_Unmet_Need_Report",
      params: {
        institution: "",
        startDate: now,
        endDate: now,
        offeringIntensity: {
          "Full Time": true,
          "Part Time": true,
        },
        sabcProgramCode: "",
      },
    };
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: FormNames.ExportFinancialReports,
      data: { data: payload },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    const endpoint = "/aest/report";
    const ministryUserToken = await getAESTToken(
      AESTGroups.BusinessAdministrators,
    );
    const assessmentData = savedApplication.currentAssessment
      .assessmentData as FullTimeAssessment;
    const applicationData = savedApplication.currentAssessment.application.data;
    const savedOffering = savedApplication.currentAssessment.offering;
    const savedEducationProgram = savedOffering.educationProgram;
    const savedLocation = savedApplication.location;
    const savedStudent = savedApplication.student;
    const savedUser = savedStudent.user;
    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(ministryUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        const fileContent = response.request.res["text"];
        const parsedResult = parse(fileContent, {
          header: true,
        });
        expect(parsedResult.data).toEqual(
          expect.arrayContaining([
            {
              "Application Disability Status": "no",
              "Application Number": savedApplication.applicationNumber,
              "Assessment Date": getISODateOnlyString(
                savedApplication.currentAssessment.assessmentDate,
              ),
              "CIP Code": savedEducationProgram.cipCode,
              "Citizenship Status": applicationData.citizenship,
              "Estimated BCAG":
                assessmentData.finalProvincialAwardNetBCAGAmount.toString(),
              "Estimated BCSL":
                assessmentData.finalProvincialAwardNetBCSLAmount.toString(),
              "Estimated BGPD":
                assessmentData.finalProvincialAwardNetBGPDAmount.toString(),
              "Estimated CSGD":
                assessmentData.finalFederalAwardNetCSGDAmount.toString(),
              "Estimated CSGF":
                assessmentData.finalFederalAwardNetCSGFAmount.toString(),
              "Estimated CSGP":
                assessmentData.finalFederalAwardNetCSGPAmount.toString(),
              "Estimated CSLP": "",
              "Estimated CSPT": "",
              "Estimated SBSD":
                assessmentData.finalProvincialAwardNetSBSDAmount.toString(),
              "Federal Assessed Resources":
                assessmentData.totalFederalAssessedResources.toString(),
              "Federal assessed need":
                assessmentData.federalAssessmentNeed.toString(),
              "Federal/Provincial Assessed Costs":
                assessmentData.totalAssessedCost.toString(),
              "Independant/Dependant": applicationData.dependantstatus,
              "Indigenous person status": applicationData.indigenousStatus,
              "Institution Location Code": savedLocation.institutionCode,
              "Institution Location Name": savedLocation.name,
              "Marital Status":
                savedApplication.currentAssessment.application
                  .relationshipStatus,
              "Number of Eligible Dependants Total":
                savedApplication.currentAssessment.workflowData.calculatedData.totalEligibleDependents.toString(),
              "Offering Name": savedOffering.name,
              "Profile Disability Status": savedStudent.disabilityStatus,
              "Program Credential Type": savedEducationProgram.credentialType,
              "Program Length": savedEducationProgram.completionYears,
              "Program Name": savedEducationProgram.name,
              "Provincial Assessed Resources":
                assessmentData.totalProvincialAssessedResources.toString(),
              "Provincial assessed need":
                assessmentData.provincialAssessmentNeed.toString(),
              "SABC Program Code": "",
              SIN: savedStudent.sinValidation.sin,
              "Student Email Address": savedUser.email,
              "Student First Name": savedUser.firstName,
              "Student Last Name": savedUser.lastName,
              "Student Number": "",
              "Student Phone Number": savedStudent.contactInfo.phone,
              "Study End Date": savedOffering.studyEndDate,
              "Study Intensity (PT or FT)": savedOffering.offeringIntensity,
              "Study Start Date": savedOffering.studyStartDate,
              "Total assistance": assessmentData.finalAwardTotal.toString(),
              "Year of Study": savedOffering.yearOfStudy.toString(),
              "Youth in Care Flag": applicationData.youthInCare,
              "Youth in Care beyond age 19": "",
            },
          ]),
        );
      });
  });

  it("Should generate the Disbursements Without Valid Supplier report when a report generation request is made with the appropriate date range.", async () => {
    // Arrange
    const application1 = await saveFakeApplicationDisbursements(
      appDataSource,
      {
        firstDisbursementValues: [
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "BCAG",
            500,
            {
              effectiveAmount: 500,
            },
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "SBSD",
            300,
            {
              effectiveAmount: 298,
            },
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "BGPD",
            200,
            {
              effectiveAmount: 198,
            },
          ),
        ],
        secondDisbursementValues: [
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "BCAG",
            500,
            {
              effectiveAmount: 499,
            },
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "SBSD",
            300,
            {
              effectiveAmount: 299,
            },
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "BGPD",
            200,
            {
              effectiveAmount: 199,
            },
          ),
        ],
      },
      {
        createSecondDisbursement: true,
        applicationStatus: ApplicationStatus.Completed,
        offeringIntensity: OfferingIntensity.partTime,
        firstDisbursementInitialValues: {
          coeStatus: COEStatus.completed,
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          dateSent: new Date("2020-01-01"),
        },
        secondDisbursementInitialValues: {
          coeStatus: COEStatus.completed,
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          dateSent: new Date("2020-02-01"),
        },
      },
    );
    const student1 = application1.student;
    student1.user.identityProviderType = IdentityProviders.BCSC;
    await db.user.save(student1.user);
    const sinValidation1 = createFakeSINValidation({
      student: student1,
    });
    student1.sinValidation = sinValidation1;
    await db.student.save(student1);
    await db.sinValidation.save(sinValidation1);
    const casSupplier1 = await saveFakeCASSupplier(
      db,
      {
        student: student1,
      },
      {
        initialValues: {
          isValid: false,
        },
      },
    );
    student1.casSupplier = casSupplier1;
    await db.student.save(student1);

    const application2 = await saveFakeApplicationDisbursements(
      appDataSource,
      {
        firstDisbursementValues: [
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "BCAG",
            500,
            {
              effectiveAmount: 100,
            },
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "SBSD",
            300,
            {
              effectiveAmount: 150,
            },
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "BGPD",
            200,
            {
              effectiveAmount: 275,
            },
          ),
        ],
      },
      {
        applicationStatus: ApplicationStatus.Completed,
        offeringIntensity: OfferingIntensity.fullTime,
        firstDisbursementInitialValues: {
          coeStatus: COEStatus.completed,
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          dateSent: new Date("2020-01-15"),
        },
      },
    );
    const student2 = application2.student;
    student2.user.identityProviderType = IdentityProviders.BCeIDBasic;
    await db.user.save(student2.user);
    const sinValidation2 = createFakeSINValidation({
      student: student2,
    });
    student2.sinValidation = sinValidation2;
    await db.student.save(student2);
    await db.sinValidation.save(sinValidation2);
    const casSupplier2 = await saveFakeCASSupplier(
      db,
      {
        student: student2,
      },
      {
        initialValues: {
          isValid: false,
        },
      },
    );
    student2.casSupplier = casSupplier2;
    await db.student.save(student2);

    const payload = {
      reportName: "Disbursements_Without_Valid_Supplier_Report",
      params: {
        startDate: "2020-01-01",
        endDate: "2020-02-01",
      },
    };
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: FormNames.ExportFinancialReports,
      data: { data: payload },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    const endpoint = "/aest/report";
    const ministryUserToken = await getAESTToken(
      AESTGroups.BusinessAdministrators,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(ministryUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        const fileContent = response.request.res["text"];
        const parsedResult = parse(fileContent, {
          header: true,
        });
        expect(parsedResult.data).toStrictEqual([
          {
            "Address Line 1": student1.contactInfo.address.addressLine1,
            BCAG: "999.00",
            BGPD: "397.00",
            City: student1.contactInfo.address.city,
            Country: student1.contactInfo.address.country,
            "Disability Status": student1.disabilityStatus,
            "Given Name": student1.user.firstName,
            "Last Name": student1.user.lastName,
            "Postal Code": student1.contactInfo.address.postalCode,
            "Profile Type": student1.user.identityProviderType,
            Province: student1.contactInfo.address.provinceState,
            SBSD: "597.00",
            SIN: student1.sinValidation.sin,
          },
          {
            "Address Line 1": student2.contactInfo.address.addressLine1,
            BCAG: "100.00",
            BGPD: "275.00",
            City: student2.contactInfo.address.city,
            Country: student2.contactInfo.address.country,
            "Disability Status": student2.disabilityStatus,
            "Given Name": student2.user.firstName,
            "Last Name": student2.user.lastName,
            "Postal Code": student2.contactInfo.address.postalCode,
            "Profile Type": student2.user.identityProviderType,
            Province: student2.contactInfo.address.provinceState,
            SBSD: "150.00",
            SIN: student2.sinValidation.sin,
          },
        ]);
      });
  });

  it(
    "Should generate CAS Supplier maintenance updates report with the student details of the given student" +
      " when last name of the student is updated after the CAS supplier is set to be valid.",
    async () => {
      // Arrange
      // Save a CASSupplier for the student.
      await saveFakeCASSupplier(
        db,
        { student: sharedCASSupplierUpdatedStudent },
        {
          initialValues: {
            supplierStatus: SupplierStatus.Verified,
            isValid: true,
          },
        },
      );
      // Update the student's last name.
      sharedCASSupplierUpdatedStudent.user.lastName = "Updated Last Name";
      await db.student.save(sharedCASSupplierUpdatedStudent);

      const casSupplierMaintenanceUpdates =
        "CAS_Supplier_Maintenance_Updates_Report";
      const endpoint = "/aest/report";
      const ministryUserToken = await getAESTToken(
        AESTGroups.BusinessAdministrators,
      );

      // Payload with no parameters.
      const payload = {
        reportName: casSupplierMaintenanceUpdates,
        params: {},
      };
      const dryRunSubmissionMock = jest.fn().mockResolvedValue({
        valid: true,
        formName: FormNames.ExportFinancialReports,
        data: { data: payload },
      });
      formService.dryRunSubmission = dryRunSubmissionMock;

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .auth(ministryUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          const fileContent = response.request.res["text"];
          const parsedResult = parse(fileContent, {
            header: true,
          });
          const expectedReportData = buildCASSupplierMaintenanceUpdatesReport(
            sharedCASSupplierUpdatedStudent,
            { lastNameUpdated: true },
          );
          const [actualReportData] = parsedResult.data as Record<
            string,
            string
          >[];
          expect(parsedResult.data.length).toBe(1);
          expect(actualReportData).toEqual(expectedReportData);
        });
    },
  );

  it(
    "Should generate CAS Supplier maintenance updates report with the student details of the given student" +
      " when SIN number of the student is updated after the CAS supplier is set to be valid.",
    async () => {
      // Arrange
      // Save a CASSupplier for the student.
      await saveFakeCASSupplier(
        db,
        { student: sharedCASSupplierUpdatedStudent },
        {
          initialValues: {
            supplierStatus: SupplierStatus.Verified,
            isValid: true,
          },
        },
      );
      // Update the student's SIN.
      const newSINValidation = createFakeSINValidation({
        student: sharedCASSupplierUpdatedStudent,
      });
      sharedCASSupplierUpdatedStudent.sinValidation = newSINValidation;
      await db.student.save(sharedCASSupplierUpdatedStudent);

      const casSupplierMaintenanceUpdates =
        "CAS_Supplier_Maintenance_Updates_Report";
      const endpoint = "/aest/report";
      const ministryUserToken = await getAESTToken(
        AESTGroups.BusinessAdministrators,
      );

      // Payload with no parameters.
      const payload = {
        reportName: casSupplierMaintenanceUpdates,
        params: {},
      };
      const dryRunSubmissionMock = jest.fn().mockResolvedValue({
        valid: true,
        formName: FormNames.ExportFinancialReports,
        data: { data: payload },
      });
      formService.dryRunSubmission = dryRunSubmissionMock;

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .auth(ministryUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          const fileContent = response.request.res["text"];
          const parsedResult = parse(fileContent, {
            header: true,
          });
          const expectedReportData = buildCASSupplierMaintenanceUpdatesReport(
            sharedCASSupplierUpdatedStudent,
            { sinUpdated: true },
          );
          const [actualReportData] = parsedResult.data as Record<
            string,
            string
          >[];
          expect(parsedResult.data.length).toBe(1);
          expect(actualReportData).toEqual(expectedReportData);
        });
    },
  );

  it(
    "Should generate CAS Supplier maintenance updates report with the student details of the given student" +
      " when 'address line 1' of the student is updated after the CAS supplier is set to be valid.",
    async () => {
      // Arrange
      // Save a CASSupplier for the student.
      await saveFakeCASSupplier(
        db,
        { student: sharedCASSupplierUpdatedStudent },
        {
          initialValues: {
            supplierStatus: SupplierStatus.Verified,
            isValid: true,
          },
        },
      );
      // Update the student's address line 1.
      sharedCASSupplierUpdatedStudent.contactInfo.address.addressLine1 =
        "Updated Address Line 1";
      await db.student.save(sharedCASSupplierUpdatedStudent);

      const casSupplierMaintenanceUpdates =
        "CAS_Supplier_Maintenance_Updates_Report";
      const endpoint = "/aest/report";
      const ministryUserToken = await getAESTToken(
        AESTGroups.BusinessAdministrators,
      );

      // Payload with no parameters.
      const payload = {
        reportName: casSupplierMaintenanceUpdates,
        params: {},
      };
      const dryRunSubmissionMock = jest.fn().mockResolvedValue({
        valid: true,
        formName: FormNames.ExportFinancialReports,
        data: { data: payload },
      });
      formService.dryRunSubmission = dryRunSubmissionMock;

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .auth(ministryUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          const fileContent = response.request.res["text"];
          const parsedResult = parse(fileContent, {
            header: true,
          });
          const expectedReportData = buildCASSupplierMaintenanceUpdatesReport(
            sharedCASSupplierUpdatedStudent,
            { addressLine1Updated: true },
          );
          const [actualReportData] = parsedResult.data as Record<
            string,
            string
          >[];
          expect(parsedResult.data.length).toBe(1);
          expect(actualReportData).toEqual(expectedReportData);
        });
    },
  );

  it(
    "Should generate CAS Supplier maintenance updates report with the student details of the given student" +
      " when postal code of the student is updated after the CAS supplier is set to be valid.",
    async () => {
      // Arrange
      // Save a CASSupplier for the student.
      await saveFakeCASSupplier(
        db,
        { student: sharedCASSupplierUpdatedStudent },
        {
          initialValues: {
            supplierStatus: SupplierStatus.Verified,
            isValid: true,
          },
        },
      );
      // Update the student's postal code.
      sharedCASSupplierUpdatedStudent.contactInfo.address.postalCode =
        "Updated postal code";
      await db.student.save(sharedCASSupplierUpdatedStudent);

      const casSupplierMaintenanceUpdates =
        "CAS_Supplier_Maintenance_Updates_Report";
      const endpoint = "/aest/report";
      const ministryUserToken = await getAESTToken(
        AESTGroups.BusinessAdministrators,
      );

      // Payload with no parameters.
      const payload = {
        reportName: casSupplierMaintenanceUpdates,
        params: {},
      };
      const dryRunSubmissionMock = jest.fn().mockResolvedValue({
        valid: true,
        formName: FormNames.ExportFinancialReports,
        data: { data: payload },
      });
      formService.dryRunSubmission = dryRunSubmissionMock;

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .auth(ministryUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          const fileContent = response.request.res["text"];
          const parsedResult = parse(fileContent, {
            header: true,
          });
          const expectedReportData = buildCASSupplierMaintenanceUpdatesReport(
            sharedCASSupplierUpdatedStudent,
            { postalCodeUpdated: true },
          );
          const [actualReportData] = parsedResult.data as Record<
            string,
            string
          >[];
          expect(parsedResult.data.length).toBe(1);
          expect(actualReportData).toEqual(expectedReportData);
        });
    },
  );

  it(
    "Should generate CAS Supplier maintenance updates report without the student details of the given student" +
      " when last name of the student is updated just to change the case to upper case characters.",
    async () => {
      // Arrange
      // Save a CASSupplier for the student.
      await saveFakeCASSupplier(
        db,
        { student: sharedCASSupplierUpdatedStudent },
        {
          initialValues: {
            supplierStatus: SupplierStatus.Verified,
            isValid: true,
          },
        },
      );
      // Update the student's last name to upper case.
      sharedCASSupplierUpdatedStudent.user.lastName =
        sharedCASSupplierUpdatedStudent.user.lastName.toUpperCase();
      await db.student.save(sharedCASSupplierUpdatedStudent);

      const casSupplierMaintenanceUpdates =
        "CAS_Supplier_Maintenance_Updates_Report";
      const endpoint = "/aest/report";
      const ministryUserToken = await getAESTToken(
        AESTGroups.BusinessAdministrators,
      );

      // Payload with no parameters.
      const payload = {
        reportName: casSupplierMaintenanceUpdates,
        params: {},
      };
      const dryRunSubmissionMock = jest.fn().mockResolvedValue({
        valid: true,
        formName: FormNames.ExportFinancialReports,
        data: { data: payload },
      });
      formService.dryRunSubmission = dryRunSubmissionMock;

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .auth(ministryUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          const fileContent = response.request.res["text"] as string;
          expect(fileContent).toBe("");
        });
    },
  );

  /**
   * Converts education program offering object into a key-value pair object matching the result data.
   * @param fakeOffering an education program offering record.
   * @returns a key-value pair object matching the result data.
   */
  function offeringToResultData(fakeOffering: EducationProgramOffering): {
    [key: string]: string | boolean;
  } {
    return {
      "Institution Location Name": fakeOffering.institutionLocation.name,
      "Program Name": fakeOffering.educationProgram.name,
      "SABC Program Code": fakeOffering.educationProgram.sabcCode ?? "",
      "Regulatory Body": fakeOffering.educationProgram.regulatoryBody,
      "Credential Type": fakeOffering.educationProgram.credentialType,
      "Program Length": fakeOffering.educationProgram.completionYears,
      Delivery: "On-site",
      "Credit or Hours": fakeOffering.educationProgram.courseLoadCalculation,
      "Program Status": fakeOffering.educationProgram.programStatus,
      "Program Deactivated?": (!fakeOffering.educationProgram
        .isActive).toString(),
      "Program Expiry Date":
        fakeOffering.educationProgram.effectiveEndDate ?? "",
      "Offering Name": fakeOffering.name,
      "Study Start Date": fakeOffering.studyStartDate,
      "Study End Date": fakeOffering.studyEndDate,
      "Year of Study": fakeOffering.yearOfStudy.toString(),
      "Offering Type": fakeOffering.offeringType,
      "Offering Status": fakeOffering.offeringStatus,
      "Offering Intensity": fakeOffering.offeringIntensity,
    };
  }

  /**
   * Converts education program object into a key-value pair object matching the result data
   * for programs that have offerings outside the date range or don't have offerings.
   * @param fakeOffering an education program record.
   * @param fakeLocation an institution location record.
   * @returns a key-value pair object matching the result data.
   */
  function programToResultData(
    fakeProgram: EducationProgram,
    fakeLocation: InstitutionLocation,
  ): {
    [key: string]: string | boolean;
  } {
    return {
      "Institution Location Name": fakeLocation.name,
      "Program Name": fakeProgram.name,
      "SABC Program Code": fakeProgram.sabcCode ?? "",
      "Regulatory Body": fakeProgram.regulatoryBody,
      "Credential Type": fakeProgram.credentialType,
      "Program Length": fakeProgram.completionYears,
      Delivery: "On-site",
      "Credit or Hours": fakeProgram.courseLoadCalculation,
      "Program Status": fakeProgram.programStatus,
      "Program Deactivated?": (!fakeProgram.isActive).toString(),
      "Program Expiry Date": fakeProgram.effectiveEndDate ?? "",
      "Offering Name": "",
      "Study Start Date": "",
      "Study End Date": "",
      "Year of Study": "",
      "Offering Type": "",
      "Offering Status": "",
      "Offering Intensity": "",
    };
  }

  /**
   * Build CAS Supplier maintenance updates report data.
   * @param student student.
   * @param options expected report data options.
   * - `firstNameUpdated` indicates if the first name of the student is updated.
   * - `lastNameUpdated` indicates if the last name of the student is updated.
   * - `sinUpdated` indicates if the SIN number of the student is updated.
   * - `addressLine1Updated` indicates if the address line 1 of the student is updated.
   * - `cityUpdated` indicates if the city of the student is updated.
   * - `provinceUpdated` indicates if the province of the student is updated.
   * - `postalCodeUpdated` indicates if the postal code of the student is updated.
   * - `countryUpdated` indicates if the country of the student is updated.
   * @returns report data.
   */
  function buildCASSupplierMaintenanceUpdatesReport(
    student: Student,
    options?: {
      firstNameUpdated?: boolean;
      lastNameUpdated?: boolean;
      sinUpdated?: boolean;
      addressLine1Updated?: boolean;
      cityUpdated?: boolean;
      provinceUpdated?: boolean;
      postalCodeUpdated?: boolean;
      countryUpdated?: boolean;
    },
  ): Record<string, string> {
    return {
      "Given Names": student.user.firstName,
      "Last Name": student.user.lastName,
      SIN: student.sinValidation.sin,
      "Address Line 1": student.contactInfo.address.addressLine1,
      City: student.contactInfo.address.city,
      Province: student.contactInfo.address.provinceState,
      "Postal Code": student.contactInfo.address.postalCode,
      Country: student.contactInfo.address.country,
      "Disability Status": student.disabilityStatus,
      "Profile Type": student.user.identityProviderType ?? "",
      "Student Updated Date": getPSTPDTDateFormatted(student.updatedAt),
      Supplier: student.casSupplier.supplierNumber,
      Site: student.casSupplier.supplierAddress.supplierSiteCode,
      "Protected Supplier": student.casSupplier.supplierProtected?.toString(),
      "Protected Site": student.casSupplier.supplierAddress.siteProtected,
      "Supplier Verified Date": getPSTPDTDateFormatted(
        student.casSupplier.supplierStatusUpdatedOn,
      ),
      "First Name Updated": options?.firstNameUpdated ? "true" : "false",
      "Last Name Updated": options?.lastNameUpdated ? "true" : "false",
      "SIN Updated": options?.sinUpdated ? "true" : "false",
      "Address Line 1 Updated": options?.addressLine1Updated ? "true" : "false",
      "City Updated": options?.cityUpdated ? "true" : "false",
      "Province Updated": options?.provinceUpdated ? "true" : "false",
      "Postal Code Updated": options?.postalCodeUpdated ? "true" : "false",
      "Country Updated": options?.countryUpdated ? "true" : "false",
    };
  }
});
