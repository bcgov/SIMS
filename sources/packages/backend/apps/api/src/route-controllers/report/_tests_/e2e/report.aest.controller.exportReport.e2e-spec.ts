import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeDisbursementFeedbackError,
  getProviderInstanceForModule,
  saveFakeApplicationDisbursements,
  saveFakeDesignationAgreementLocation,
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
  ApplicationStatus,
  COEStatus,
  DesignationAgreement,
  DisbursementScheduleStatus,
  OfferingIntensity,
} from "@sims/sims-db";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { DataSource } from "typeorm";

describe("ReportAestController(e2e)-exportReport", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let appDataSource: DataSource;

  let formService: FormService;

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
    const [
      approvedDesignationAgreementLocation,
      declinedDesignationAgreementLocation,
    ] = await saveFakeDesignationAgreementLocation(db, {
      numberOfLocations: 2,
      initialValues: {
        endDate: getISODateOnlyString(addDays(30, new Date())),
      },
    });
    const designationAgreement =
      approvedDesignationAgreementLocation.designationAgreement;
    const designatedInstitutionLocation =
      approvedDesignationAgreementLocation.institutionLocation;
    const nonDesignatedInstitutionLocation =
      declinedDesignationAgreementLocation.institutionLocation;
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
                designatedInstitutionLocation.primaryContact.firstName +
                " " +
                designatedInstitutionLocation.primaryContact.lastName,
              "Contact Email":
                designatedInstitutionLocation.primaryContact.email,
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
                nonDesignatedInstitutionLocation.primaryContact.firstName +
                " " +
                nonDesignatedInstitutionLocation.primaryContact.lastName,
              "Contact Email":
                nonDesignatedInstitutionLocation.primaryContact.email,
            },
          ]),
        );
      });
  });
});
