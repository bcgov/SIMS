import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentScholasticStanding,
  ensureDynamicFormConfigurationExists,
  saveFakeApplication,
  saveFakeFormSubmissionFromInputTestData,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import request from "supertest";
import {
  DynamicFormType,
  FormCategory,
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
  StudentScholasticStandingChangeType,
  User,
} from "@sims/sims-db";
import { addDays } from "@sims/utilities";

describe("StudentScholasticStandingsAESTController(e2e)-getScholasticStandings.", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let auditUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    auditUser = await getAESTUser(
      dataSource,
      AESTGroups.BusinessAdministrators,
    );
  });

  it("Should get scholastic standing details sorted by submitted date DESC when multiple records exist.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource);

    // Create a fake FormSubmission to simulate a previously submitted non-punitive withdrawal form.
    const dynamicFormConfiguration = await ensureDynamicFormConfigurationExists(
      db,
      DynamicFormType.NonPunitiveWithdrawal,
    );
    const savedFormSubmission = await saveFakeFormSubmissionFromInputTestData(
      db,
      {
        student: application.student,
        formCategory: FormCategory.StudentForm,
        submissionStatus: FormSubmissionStatus.Completed,
        ministryAuditUser: auditUser,
        formSubmissionItems: [
          {
            dynamicFormConfiguration,
            decisions: [
              {
                decisionStatus: FormSubmissionDecisionStatus.Approved,
              },
            ],
          },
        ],
      },
    );
    const [savedFormSubmissionItem] = savedFormSubmission.formSubmissionItems;

    // Withdrawal record with non-punitive form submission.
    const withdrewScholasticStanding = createFakeStudentScholasticStanding(
      {
        submittedBy: application.student.user,
        application,
        nonPunitiveFormSubmissionItem: savedFormSubmissionItem,
      },
      {
        initialValues: {
          changeType:
            StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
          submittedDate: addDays(-3),
          submittedData: {
            dateOfWithdrawal: "2026-01-15",
          },
        },
      },
    );
    // Did Not Complete record.
    const didNotCompleteScholasticStanding =
      createFakeStudentScholasticStanding(
        {
          submittedBy: application.student.user,
          application,
        },
        {
          initialValues: {
            changeType:
              StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
            submittedDate: addDays(-2),
          },
        },
      );
    // School Transfer record with reversal date.
    const transferScholasticStanding = createFakeStudentScholasticStanding(
      {
        submittedBy: application.student.user,
        application,
      },
      {
        initialValues: {
          changeType: StudentScholasticStandingChangeType.SchoolTransfer,
          submittedDate: addDays(-5),
          reversalDate: addDays(-2),
        },
      },
    );

    const [
      savedWithdrewScholasticStanding,
      savedDidNotCompleteScholasticStanding,
      savedTransferScholasticStanding,
    ] = await db.studentScholasticStanding.save([
      withdrewScholasticStanding,
      didNotCompleteScholasticStanding,
      transferScholasticStanding,
    ]);

    const endpoint = `/aest/scholastic-standing/student/${application.student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toMatchObject([
          {
            scholasticStandingId: savedDidNotCompleteScholasticStanding.id,
            applicationId: application.id,
            applicationNumber: application.applicationNumber,
            submittedDate:
              savedDidNotCompleteScholasticStanding.submittedDate.toISOString(),
            scholasticStandingChangeType:
              savedDidNotCompleteScholasticStanding.changeType,
          },
          {
            scholasticStandingId: savedWithdrewScholasticStanding.id,
            applicationId: application.id,
            applicationNumber: application.applicationNumber,
            submittedDate:
              savedWithdrewScholasticStanding.submittedDate.toISOString(),
            dateOfWithdrawal: new Date(
              savedWithdrewScholasticStanding.submittedData.dateOfWithdrawal,
            ).toISOString(),
            scholasticStandingChangeType:
              savedWithdrewScholasticStanding.changeType,
            nonPunitiveFormSubmissionId: savedFormSubmissionItem.id,
          },
          {
            scholasticStandingId: savedTransferScholasticStanding.id,
            applicationId: application.id,
            applicationNumber: application.applicationNumber,
            submittedDate:
              savedTransferScholasticStanding.submittedDate.toISOString(),
            scholasticStandingChangeType:
              savedTransferScholasticStanding.changeType,
            reversalDate:
              savedTransferScholasticStanding.reversalDate?.toISOString(),
          },
        ]),
      );
  });

  it("Should return Not Found (404) when student is not found.", async () => {
    // Arrange
    const endpoint = "/aest/scholastic-standing/student/9999999";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Student does not exist.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it("Should throw forbidden error when ministry user does not have the required permission(s) to get scholastic standing history.", async () => {
    // Arrange
    const endpoint = "/aest/scholastic-standing/student/9999999";
    const token = await getAESTToken(AESTGroups.Operations);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message: "Forbidden resource",
        error: "Forbidden",
        statusCode: HttpStatus.FORBIDDEN,
      });
  });
});
