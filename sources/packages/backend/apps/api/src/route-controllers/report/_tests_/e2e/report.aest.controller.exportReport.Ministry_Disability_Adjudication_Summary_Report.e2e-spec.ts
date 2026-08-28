import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeFormSubmissionFromInputTestData,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import { parse } from "papaparse";
import request from "supertest";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import {
  DisabilityStatus,
  DynamicFormConfiguration,
  FormCategory,
  FormSubmission,
  FormSubmissionCancellationReason,
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
  Student,
  User,
} from "@sims/sims-db/entities";

describe("ReportAESTController(e2e)-exportReport(Ministry_Disability_Adjudication_Summary_Report)", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let formConfig: DynamicFormConfiguration;
  let ministryUser: User;
  let student: Student;
  const endpoint = "/aest/report";
  // Choose a date range unique to this test suite.
  const startDate = new Date("2026-01-01");
  const endDate = addDays(1, startDate);
  const payload = {
    reportName: "Ministry_Disability_Adjudication_Summary_Report",
    params: {
      startDate,
      endDate,
      isLimitedByArchiveDate: false,
    },
  };

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    formConfig = await db.dynamicFormConfiguration.findOneOrFail({
      select: { id: true },
      where: {
        formDefinitionName: "disabilitystatusapplicationform",
      },
    });
    ministryUser = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
    student = await saveFakeStudent(db.dataSource);
  });

  beforeEach(async () => {
    // Cancel form submissions for this student to keep the test data clean.
    await db.formSubmission.update(
      {
        student: { id: student.id },
      },
      {
        submissionStatus: FormSubmissionStatus.Cancelled,
        cancellationReason:
          FormSubmissionCancellationReason.StudentCancelledSubmission,
      },
    );
  });

  it(`Should generate a report with 2 records when the submission status is ${FormSubmissionStatus.Completed} or ${FormSubmissionStatus.Declined}.`, async () => {
    // Arrange

    // Create an Approved PD (older) and a Declined PPD (newer) within the selected date range.
    const approvedPD = await saveFakeFormSubmissionFromInputTestData(db, {
      student,
      formCategory: FormCategory.StudentForm,
      submissionStatus: FormSubmissionStatus.Completed,
      ministryAuditUser: ministryUser,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfig,
          decisions: [
            {
              decisionStatus: FormSubmissionDecisionStatus.Approved,
            },
          ],
          submittedData: {
            requestedDisabilityStatus: DisabilityStatus.PD,
          },
        },
      ],
      now: startDate,
    });
    const declinedPPD = await saveFakeFormSubmissionFromInputTestData(db, {
      student,
      formCategory: FormCategory.StudentForm,
      submissionStatus: FormSubmissionStatus.Declined,
      ministryAuditUser: ministryUser,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfig,
          decisions: [
            {
              decisionStatus: FormSubmissionDecisionStatus.Declined,
            },
          ],
          submittedData: {
            requestedDisabilityStatus: DisabilityStatus.PPD,
          },
        },
      ],
      now: endDate,
    });

    const ministryUserToken = await getAESTToken(
      AESTGroups.BusinessAdministrators,
    );
    // Expected report records.
    const expectedRecords = [
      buildDisabilityAdjudicationSummaryReportData(approvedPD),
      buildDisabilityAdjudicationSummaryReportData(declinedPPD),
    ];

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
        expect(parsedResult.data).toEqual(expectedRecords);
      });
  });

  it(`Should generate an empty report when the submission status is ${FormSubmissionStatus.Pending}.`, async () => {
    // Arrange

    // Create an Approved PD with a pending decision.
    await saveFakeFormSubmissionFromInputTestData(db, {
      student,
      formCategory: FormCategory.StudentForm,
      submissionStatus: FormSubmissionStatus.Pending,
      ministryAuditUser: ministryUser,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfig,
          decisions: [
            {
              decisionStatus: FormSubmissionDecisionStatus.Approved,
            },
          ],
          submittedData: {
            requestedDisabilityStatus: DisabilityStatus.PD,
          },
        },
      ],
      now: startDate,
    });

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
  });

  it("Should generate an empty report when the submission was approved before the start date.", async () => {
    // Arrange

    // Create an Approved PD with Completed decision before the start date.
    await saveFakeFormSubmissionFromInputTestData(db, {
      student,
      formCategory: FormCategory.StudentForm,
      submissionStatus: FormSubmissionStatus.Completed,
      ministryAuditUser: ministryUser,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfig,
          decisions: [
            {
              decisionStatus: FormSubmissionDecisionStatus.Approved,
            },
          ],
          submittedData: {
            requestedDisabilityStatus: DisabilityStatus.PD,
          },
        },
      ],
      now: addDays(-1, startDate),
    });

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
  });
});

/**
 * Builds the expected report data for the Ministry_Disability_Adjudication_Summary_Report based on the form submission.
 * @param formSubmission The form submission to build the report data from.
 * @returns The expected report data.
 */
function buildDisabilityAdjudicationSummaryReportData(
  formSubmission: FormSubmission,
): Record<string, string> {
  const [formSubmissionItem] = formSubmission.formSubmissionItems;
  return {
    "Given Name": formSubmission.student.user.firstName,
    "Last Name": formSubmission.student.user.lastName,
    "Date Of Birth": formSubmission.student.birthDate,
    "Disability Status": formSubmissionItem.submittedData
      .requestedDisabilityStatus as string,
    Outcome: formSubmissionItem.decisions[0].decisionStatus,
    "Completed By":
      formSubmission.assessedBy?.firstName +
      " " +
      formSubmission.assessedBy?.lastName,
    "Date Completed": getISODateOnlyString(formSubmission.assessedDate),
  };
}
