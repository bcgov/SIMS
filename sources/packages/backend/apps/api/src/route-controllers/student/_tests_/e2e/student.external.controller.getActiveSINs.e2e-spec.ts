import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  createE2EDataSources,
  createFakeSFASApplication,
  createFakeSFASApplicationDisbursement,
  createFakeSINValidation,
  E2EDataSources,
  saveFakeApplicationDisbursements,
  saveFakeSFASIndividual,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  DisbursementScheduleStatus,
  OfferingIntensity,
} from "@sims/sims-db";
import {
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  getExternalUserToken,
} from "../../../../testHelpers";
import { addDays, getISODateOnlyString } from "@sims/utilities";

describe("StudentExternalController(e2e)-getActiveSINs", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  const endpoint = "/external/student/active-sins";

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should include SIMS student SIN when student has a FT application with start date between now and 90 days in the future and no cancelled status.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Create a FT application with a study start date 45 days in the future.
    await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.fullTime,
        offeringInitialValues: {
          studyStartDate: getISODateOnlyString(addDays(45)),
          studyEndDate: getISODateOnlyString(addDays(120)),
        },
      },
    );
    const token = await getExternalUserToken();
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body.sins).toEqual(
          expect.arrayContaining([student.sinValidation.sin]),
        ),
      );
  });

  it("Should include SIMS student SIN when student has a FT application currently within the study period and no cancelled status.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Create a FT application with a study start date in the past and end date in the future.
    await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.fullTime,
      },
    );
    const token = await getExternalUserToken();
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body.sins).toEqual(
          expect.arrayContaining([student.sinValidation.sin]),
        ),
      );
  });
  it("Should include SIMS student SIN when student has a FT application with a disbursement sent in the last 90 days and no cancelled status.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Create a FT application with a disbursement sent 60 days ago.
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.fullTime,
        offeringInitialValues: {
          studyStartDate: getISODateOnlyString(addDays(-120)),
          studyEndDate: getISODateOnlyString(addDays(-60)),
        },
        // Set the disbursement as Sent with dateSent within the last 90 days.
        firstDisbursementInitialValues: {
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          dateSent: addDays(-60),
        },
      },
    );
    const [disbursement] = application.currentAssessment.disbursementSchedules;
    await db.disbursementSchedule.save(disbursement);
    const token = await getExternalUserToken();
    // Act
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body.sins).toEqual(
          expect.arrayContaining([student.sinValidation.sin]),
        ),
      );
  });

  it("Should not include SIMS student SIN when student has only a cancelled FT application that would otherwise match the study start date criteria.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Create a cancelled FT application with a study start date 45 days in the future.
    await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        applicationStatus: ApplicationStatus.Cancelled,
        offeringIntensity: OfferingIntensity.fullTime,
        offeringInitialValues: {
          studyStartDate: getISODateOnlyString(addDays(45)),
          studyEndDate: getISODateOnlyString(addDays(120)),
        },
      },
    );
    const token = await getExternalUserToken();
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body.sins).not.toContain(student.sinValidation.sin),
      );
  });

  it("Should return only the most recent valid SIMS student SIN when a student has multiple valid SIN records.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const olderValidSIN = student.sinValidation.sin;
    // Create a newer SIN validation with a different SIN also marked as valid.
    const newerSINValidation = createFakeSINValidation(
      { student },
      { initialValue: { isValidSIN: true } },
    );
    await db.sinValidation.save(newerSINValidation);
    // Update the student to point to the newer SIN validation as the current one.
    student.sinValidation = newerSINValidation;
    await db.student.save(student);
    // Create a FT application with a study start date 45 days in the future.
    await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.fullTime,
        offeringInitialValues: {
          studyStartDate: getISODateOnlyString(addDays(45)),
          studyEndDate: getISODateOnlyString(addDays(120)),
        },
      },
    );
    const token = await getExternalUserToken();
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.sins).toContain(newerSINValidation.sin);
        expect(body.sins).not.toContain(olderValidSIN);
      });
  });
  it("Should include SFAS student SIN when student has a FT application with start date between now and 90 days in the future and no cancelled status.", async () => {
    // Arrange
    const individual = await saveFakeSFASIndividual(db.dataSource);
    const sfasApplication = createFakeSFASApplication(
      { individual },
      {
        initialValues: {
          startDate: getISODateOnlyString(addDays(45)),
          endDate: getISODateOnlyString(addDays(120)),
          applicationCancelDate: null,
        },
      },
    );
    await db.sfasApplication.save(sfasApplication);
    const token = await getExternalUserToken();
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.sins).toContain(individual.sin);
      });
  });

  it("Should include SFAS student SIN when student has a FT application currently within the study period and no cancelled status.", async () => {
    // Arrange
    const individual = await saveFakeSFASIndividual(db.dataSource);
    const sfasApplication = createFakeSFASApplication(
      { individual },
      {
        initialValues: {
          startDate: getISODateOnlyString(addDays(-30)),
          endDate: getISODateOnlyString(addDays(30)),
          applicationCancelDate: null,
        },
      },
    );
    await db.sfasApplication.save(sfasApplication);
    const token = await getExternalUserToken();
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.sins).toContain(individual.sin);
      });
  });
  it("Should include SFAS student SIN when student has a FT application with disbursement date issued in the last 90 days and no cancelled status.", async () => {
    // Arrange
    const individual = await saveFakeSFASIndividual(db.dataSource);
    // Create a SFAS application with a past study period.
    const sfasApplication = createFakeSFASApplication(
      { individual },
      {
        initialValues: {
          startDate: getISODateOnlyString(addDays(-120)),
          endDate: getISODateOnlyString(addDays(-60)),
          applicationCancelDate: null,
        },
      },
    );
    await db.sfasApplication.save(sfasApplication);
    // Create a disbursement with dateIssued within the last 90 days.
    const disbursement = createFakeSFASApplicationDisbursement(
      { sfasApplication },
      {
        initialValues: {
          dateIssued: getISODateOnlyString(addDays(-60)),
        },
      },
    );
    await db.sfasApplicationDisbursement.save(disbursement);
    const token = await getExternalUserToken();
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.sins).toContain(individual.sin);
      });
  });

  it("Should not include SFAS student SIN when student has only a cancelled FT application that would otherwise match the study start date criteria.", async () => {
    // Arrange
    const individual = await saveFakeSFASIndividual(db.dataSource);
    // Create a cancelled SFAS application with a start date in the next 90 days.
    const sfasApplication = createFakeSFASApplication(
      { individual },
      {
        initialValues: {
          startDate: getISODateOnlyString(addDays(45)),
          endDate: getISODateOnlyString(addDays(120)),
          applicationCancelDate: getISODateOnlyString(addDays(-5)),
        },
      },
    );
    await db.sfasApplication.save(sfasApplication);
    const token = await getExternalUserToken();
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.sins).not.toContain(individual.sin);
      });
  });

  it("Should return HTTP 401 when request is not authenticated.", async () => {
    await request(app.getHttpServer())
      .get(endpoint)
      .expect(HttpStatus.UNAUTHORIZED);
  });

  afterAll(async () => {
    await app?.close();
  });
});
