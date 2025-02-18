import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../testHelpers";
import {
  E2EDataSources,
  MSFAAStates,
  createE2EDataSources,
  createFakeMSFAANumber,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  COEStatus,
  DisbursementScheduleStatus,
  MSFAANumber,
  OfferingIntensity,
  Student,
} from "@sims/sims-db";

describe("ApplicationAESTController(e2e)-getCompletedApplicationDetails", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let sharedStudent: Student;
  let sharedPartTimeSignedMSFAANumber: MSFAANumber;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    // Create a student with valid SIN and valid MSFAA number.
    sharedStudent = await saveFakeStudent(db.dataSource);
    sharedPartTimeSignedMSFAANumber = createFakeMSFAANumber(
      { student: sharedStudent },
      {
        msfaaState: MSFAAStates.Signed,
        msfaaInitialValues: { offeringIntensity: OfferingIntensity.partTime },
      },
    );
    await db.msfaaNumber.save(sharedPartTimeSignedMSFAANumber);
  });

  it(
    "Should get application details when application is in 'Completed' status" +
      " with original assessment and valid MSFAA Number and offering intensity is part-time.",
    async () => {
      // Arrange
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student: sharedStudent,
          msfaaNumber: sharedPartTimeSignedMSFAANumber,
        },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Completed,
          firstDisbursementInitialValues: { coeStatus: COEStatus.completed },
        },
      );

      const endpoint = `/aest/application/${application.id}/completed`;
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          firstDisbursement: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          },
          assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
          hasBlockFundingFeedbackError: false,
          eCertFailedValidations: [],
        });
    },
  );

  it("Should throw not found error when application is not found.", async () => {
    // Arrange
    const endpoint = "/aest/application/99999999/completed";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Application not found or not on Completed status.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
