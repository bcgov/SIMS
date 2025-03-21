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
  MSFAANumber,
  OfferingIntensity,
  ProgramInfoStatus,
  Student,
} from "@sims/sims-db";

describe("ApplicationAESTController(e2e)-getApplicationProgressDetails", () => {
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
    "Should get the status of all requests and confirmations in student application" +
      " when the application is in 'Completed' status with original assessment and valid MSFAA Number" +
      " and COE is completed and offering intensity is part-time.",
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
          pirStatus: ProgramInfoStatus.notRequired,
          firstDisbursementInitialValues: { coeStatus: COEStatus.completed },
        },
      );

      const endpoint = `/aest/application/${application.id}/progress-details`;
      // As the feature is accessible for all groups, using a group other than business administrators.
      const token = await getAESTToken(AESTGroups.Operations);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          applicationStatus: ApplicationStatus.Completed,
          applicationStatusUpdatedOn:
            application.applicationStatusUpdatedOn.toISOString(),
          pirStatus: ProgramInfoStatus.notRequired,
          firstCOEStatus: COEStatus.completed,
          assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
          hasBlockFundingFeedbackError: false,
          hasECertFailedValidations: false,
          currentAssessmentId: application.currentAssessment.id,
        });
    },
  );

  it("Should throw not found error when application is not found.", async () => {
    // Arrange
    const endpoint = "/aest/application/99999999/progress-details";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Application id 99999999 was not found.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
