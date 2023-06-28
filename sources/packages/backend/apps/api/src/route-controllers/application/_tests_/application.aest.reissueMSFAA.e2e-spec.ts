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
  saveFakeApplication,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  DisbursementScheduleStatus,
  OfferingIntensity,
} from "@sims/sims-db";

describe("ApplicationAESTController(e2e)-reissueMSFAA", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should reissue an MSFAA and associate with both disbursements when both disbursements are pending and the current MSFAA is signed but canceled.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const currentMSFAA = createFakeMSFAANumber(
      { student },
      {
        msfaaState: MSFAAStates.Signed | MSFAAStates.CancelledOtherProvince,
      },
    );
    await db.msfaaNumber.save(currentMSFAA);
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student, msfaaNumber: currentMSFAA },
      {
        applicationStatus: ApplicationStatus.Completed,
        createSecondDisbursement: true,
      },
    );
    const [firstSchedule, secondSchedule] =
      application.currentAssessment.disbursementSchedules;
    const endpoint = `/aest/application/${application.id}/reissue-msfaa`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    let createdMSFAAId: number;
    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => (createdMSFAAId = +response.body.id));
    // Validate DB changes.
    await assertMSFAAnumbersForDisbursements([
      {
        disbursementId: firstSchedule.id,
        msfaaNumberId: createdMSFAAId,
      },
      {
        disbursementId: secondSchedule.id,
        msfaaNumberId: createdMSFAAId,
      },
    ]);
  });

  it(
    "Should reissue an MSFAA and associate with only the pending disbursement " +
      "when one disbursement is not pending and the other is pending and the current MSFAA is canceled.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      const currentMSFAA = createFakeMSFAANumber(
        { student },
        {
          msfaaState: MSFAAStates.CancelledSystem,
        },
      );
      await db.msfaaNumber.save(currentMSFAA);
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student, msfaaNumber: currentMSFAA },
        {
          applicationStatus: ApplicationStatus.Assessment,
          createSecondDisbursement: true,
        },
      );
      const [firstSchedule, secondSchedule] =
        application.currentAssessment.disbursementSchedules;
      firstSchedule.disbursementScheduleStatus =
        DisbursementScheduleStatus.Sent;
      await db.disbursementSchedule.save(firstSchedule);
      const endpoint = `/aest/application/${application.id}/reissue-msfaa`;
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);
      let createdMSFAAId: number;
      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => (createdMSFAAId = +response.body.id));
      // Validate DB changes.
      await assertMSFAAnumbersForDisbursements([
        {
          disbursementId: firstSchedule.id,
          msfaaNumberId: currentMSFAA.id,
        },
        {
          disbursementId: secondSchedule.id,
          msfaaNumberId: createdMSFAAId,
        },
      ]);
    },
  );

  it(
    "Should reissue an MSFAA and associate with only pending disbursements across multiple applications for the same offering intensity and same student " +
      "when some disbursements are pending, some are not and there is at least on application from a different intensity.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      const currentMSFAA = createFakeMSFAANumber(
        { student },
        {
          msfaaState: MSFAAStates.Signed | MSFAAStates.CancelledOtherProvince,
        },
      );
      await db.msfaaNumber.save(currentMSFAA);
      // Application with cancelled MSFAA to be reissued.
      const applicationToReissueMSFAA = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student, msfaaNumber: currentMSFAA },
        {
          applicationStatus: ApplicationStatus.Completed,
          createSecondDisbursement: true,
        },
      );
      const [
        applicationToReissueMSFAAFirstSchedule,
        applicationToReissueMSFAASecondSchedule,
      ] = applicationToReissueMSFAA.currentAssessment.disbursementSchedules;
      applicationToReissueMSFAAFirstSchedule.disbursementScheduleStatus =
        DisbursementScheduleStatus.Sent;
      await db.disbursementSchedule.save(
        applicationToReissueMSFAAFirstSchedule,
      );
      // Some other application with same offering intensity with MSFAA cancelled that must be updated.
      const otherApplication = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student, msfaaNumber: currentMSFAA },
        {
          applicationStatus: ApplicationStatus.Assessment,
          createSecondDisbursement: true,
        },
      );
      const [otherApplicationFirstSchedule, otherApplicationSecondSchedule] =
        otherApplication.currentAssessment.disbursementSchedules;
      // Some other application with different offering intensity with MSFAA cancelled that
      // must be updated but will not because the intensity is different.
      const otherIntensityApplication = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student, msfaaNumber: currentMSFAA },
        {
          applicationStatus: ApplicationStatus.Assessment,
          createSecondDisbursement: true,
        },
      );
      otherIntensityApplication.currentAssessment.offering.offeringIntensity =
        OfferingIntensity.partTime;
      await db.educationProgramOffering.save(
        otherIntensityApplication.currentAssessment.offering,
      );
      const [
        otherIntensityApplicationFirstSchedule,
        otherIntensityApplicationSecondSchedule,
      ] = otherIntensityApplication.currentAssessment.disbursementSchedules;

      const endpoint = `/aest/application/${applicationToReissueMSFAA.id}/reissue-msfaa`;
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);
      let createdMSFAAId: number;
      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => (createdMSFAAId = +response.body.id));
      // Validate DB changes.
      await assertMSFAAnumbersForDisbursements([
        // Reference application with one sent and one pending disbursement.
        {
          disbursementId: applicationToReissueMSFAAFirstSchedule.id,
          msfaaNumberId: currentMSFAA.id,
        },
        {
          disbursementId: applicationToReissueMSFAASecondSchedule.id,
          msfaaNumberId: createdMSFAAId,
        },
        // Application with same offering intensity that must be updated.
        {
          disbursementId: otherApplicationFirstSchedule.id,
          msfaaNumberId: createdMSFAAId,
        },
        {
          disbursementId: otherApplicationSecondSchedule.id,
          msfaaNumberId: createdMSFAAId,
        },
        // Application with different offering intensity that should not be updated.
        {
          disbursementId: otherIntensityApplicationFirstSchedule.id,
          msfaaNumberId: currentMSFAA.id,
        },
        {
          disbursementId: otherIntensityApplicationSecondSchedule.id,
          msfaaNumberId: currentMSFAA.id,
        },
      ]);
    },
  );

  it("Should throw a UnprocessableEntityException when the associated MSFAA is not cancelled.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const currentMSFAA = createFakeMSFAANumber(
      { student },
      {
        msfaaState: MSFAAStates.Signed,
      },
    );
    await db.msfaaNumber.save(currentMSFAA);
    // Application with cancelled MSFAA to be reissued.
    const applicationToReissueMSFAA = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student, msfaaNumber: currentMSFAA },
      {
        applicationStatus: ApplicationStatus.Completed,
        createSecondDisbursement: true,
      },
    );
    const endpoint = `/aest/application/${applicationToReissueMSFAA.id}/reissue-msfaa`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message:
          "Not possible to reissue an MSFAA when the current associated MSFAA is not cancelled.",
        error: "Unprocessable Entity",
      });
  });

  it("Should throw a UnprocessableEntityException when there is no pending disbursement associated with the application.", async () => {
    // Arrange
    // Application with cancelled MSFAA to be reissued.
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      undefined,
      {
        applicationStatus: ApplicationStatus.Completed,
        createSecondDisbursement: true,
      },
    );
    const [firstSchedule, secondSchedule] =
      application.currentAssessment.disbursementSchedules;
    firstSchedule.disbursementScheduleStatus = DisbursementScheduleStatus.Sent;
    secondSchedule.disbursementScheduleStatus =
      DisbursementScheduleStatus.Cancelled;
    await db.disbursementSchedule.save([firstSchedule, secondSchedule]);
    const endpoint = `/aest/application/${application.id}/reissue-msfaa`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message:
          "Not possible to reissue an MSFAA when there is no pending disbursements for the application.",
        error: "Unprocessable Entity",
      });
  });

  it("Should throw a UnprocessableEntityException when the application is not in the expected status.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.Draft,
    });
    const endpoint = `/aest/application/${application.id}/reissue-msfaa`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message:
          "Not possible to create an MSFAA when the application status is 'Draft'.",
        error: "Unprocessable Entity",
      });
  });

  it("Should throw a NotFoundException when the application does not exist.", async () => {
    // Arrange
    const endpoint = `/aest/application/9999/reissue-msfaa`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Application id 9999 was not found.`,
        error: "Not Found",
      });
  });

  /**
   * Asserts that an disbursement is associated with the correct MSFAA number.
   * @param expectedDisbursementsMSFAAs list of expected disbursement and MSFAA ids.
   */
  async function assertMSFAAnumbersForDisbursements(
    expectedDisbursementsMSFAAs: {
      disbursementId: number;
      msfaaNumberId: number;
    }[],
  ): Promise<void> {
    for (const disbursementsMSFAA of expectedDisbursementsMSFAAs) {
      const secondScheduleUpdated = await db.disbursementSchedule.findOne({
        select: { msfaaNumber: { id: true } },
        where: { id: disbursementsMSFAA.disbursementId },
      });
      expect(secondScheduleUpdated.msfaaNumberId).toBe(
        disbursementsMSFAA.msfaaNumberId,
      );
    }
  }

  it("Should not reissue an MSFAA when user is not a business administrator.", async () => {
    // Arrange
    const endpoint = "/aest/application/123/reissue-msfaa";
    const token = await getAESTToken(AESTGroups.OperationsAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: "Forbidden resource",
        error: "Forbidden",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
