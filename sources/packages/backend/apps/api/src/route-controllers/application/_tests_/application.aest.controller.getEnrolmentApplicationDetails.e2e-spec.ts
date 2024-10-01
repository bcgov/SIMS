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
  createE2EDataSources,
  saveFakeApplicationDisbursements,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  COEStatus,
  DisbursementScheduleStatus,
  OfferingIntensity,
} from "@sims/sims-db";

describe("ApplicationAESTController(e2e)-getEnrolmentApplicationDetails", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it(
    "Should get application enrolment details when the application is in 'Enrolment' status" +
      " with original assessment and offering intensity is part-time.",
    async () => {
      // Arrange
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        undefined,
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Enrolment,
          firstDisbursementInitialValues: { coeStatus: COEStatus.required },
        },
      );

      const endpoint = `/aest/application/${application.id}/enrolment`;
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          firstDisbursement: {
            coeStatus: COEStatus.required,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          },
          assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
        });
    },
  );

  it("Should throw not found error when application is not found.", async () => {
    // Arrange
    const endpoint = "/aest/application/99999999/enrolment";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message:
          "Application id 99999999 not found or not in relevant status to get enrolment details.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
