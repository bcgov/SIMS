import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeApplication,
  createFakeDisbursementFeedbackError,
  createFakeDisbursementSchedule,
  createFakeEducationProgramOffering,
  createFakeInstitutionLocation,
  createFakeStudent,
  createFakeStudentAssessment,
  createFakeUser,
  getProviderInstanceForModule,
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
import { OfferingIntensity } from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";

describe("ReportAestController(e2e)-exportReport", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let formService: FormService;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
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
    // Create fake User.
    const savedUser = await db.user.save(createFakeUser());
    const fakeUser = await db.user.save(
      createFakeUser({
        initialValue: { firstName: "John", lastName: "Doe" },
      }),
    );
    // Create fake Student.
    const fakeStudent = await db.student.save(
      createFakeStudent(fakeUser, {
        initialValue: {
          birthDate: "Jan 31 2001",
        },
      }),
    );
    // Create fake Application.
    const fakeApplication = await db.application.save(
      createFakeApplication(
        {
          student: fakeStudent,
        },
        { initialValue: { applicationNumber: "28        " } },
      ),
    );
    // Create fake Institution Location.
    const fakeInstitutionLocation = await db.institutionLocation.save(
      createFakeInstitutionLocation(),
    );
    // Create fake Education Program Offering.
    const fakeEducationProgramOffering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering(
        { auditUser: savedUser, institutionLocation: fakeInstitutionLocation },
        {
          initialValues: {
            studyStartDate: "2024-06-01",
            studyEndDate: "2024-12-01",
            offeringIntensity: OfferingIntensity.partTime,
          },
        },
      ),
    );
    // Create fake Assessment.
    const fakeStudentAssessment = await db.studentAssessment.save(
      createFakeStudentAssessment({
        auditUser: savedUser,
        application: fakeApplication,
        offering: fakeEducationProgramOffering,
      }),
    );
    // Create fake Disbursement Schedule.
    const fakeDisbursementSchedule = await db.disbursementSchedule.save(
      createFakeDisbursementSchedule(
        {
          studentAssessment: fakeStudentAssessment,
        },
        { initialValues: { documentNumber: 1234 } },
      ),
    );
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
            disbursementSchedule: fakeDisbursementSchedule,
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
          "Full Time": true,
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
        console.log(parsedResult.data);
        expect(parsedResult.data).toEqual(
          expect.arrayContaining([
            {
              "eCert Number":
                fakeDisbursementSchedule.documentNumber.toString(),
              "Application Number": fakeApplication.applicationNumber,
              "First Name": fakeUser.firstName,
              "Last Name": fakeUser.lastName,
              "Date of Birth": getISODateOnlyString(fakeStudent.birthDate),
              "Feedback File Name":
                fakeDisbursementFeedbackError.feedbackFileName,
              "Study Start Date": getISODateOnlyString(
                fakeEducationProgramOffering.studyStartDate,
              ),
              "Study End Date": getISODateOnlyString(
                fakeEducationProgramOffering.studyEndDate,
              ),
              "Error Logged Date": getISODateOnlyString(
                fakeDisbursementFeedbackError.dateReceived,
              ),
              "Error Codes": eCertFeedbackError.errorCode,
            },
          ]),
        );
      });
  });
});
