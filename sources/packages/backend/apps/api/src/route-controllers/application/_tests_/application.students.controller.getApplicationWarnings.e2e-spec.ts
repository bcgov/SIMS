import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { ArrayContains, DataSource } from "typeorm";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockUserLoginInfo,
} from "../../../testHelpers";
import {
  saveFakeApplicationDisbursements,
  createE2EDataSources,
  E2EDataSources,
  saveFakeStudentRestriction,
  createFakeMSFAANumber,
  MSFAAStates,
  saveFakeStudent,
  createFakeDisbursementValue,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  COEStatus,
  DisabilityStatus,
  DisbursementScheduleStatus,
  DisbursementValueType,
  OfferingIntensity,
  RestrictionActionType,
} from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import { ECertFailedValidation } from "@sims/integrations/services/disbursement-schedule/disbursement-schedule.models";

describe("ApplicationStudentsController(e2e)-getApplicationWarnings", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let appDataSource: DataSource;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    appDataSource = dataSource;
    db = createE2EDataSources(dataSource);
  });

  it("Should still return when application is not in 'Completed' status.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      undefined,
      { createSecondDisbursement: true },
    );
    // Mock user services to return the saved student.
    await mockUserLoginInfo(appModule, application.student);
    const endpoint = `/students/application/${application.id}/warnings`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        eCertFailedValidations: [],
        canAcceptAssessment: true,
      });
  });

  it(
    "Should return a failed ecert validations array with disability status not confirmed when " +
      "the calculated PDPPD status is true and the student's disability status is permanent disability and the offering intensity is part time.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource, undefined, {
        initialValue: {
          disabilityStatus: DisabilityStatus.Requested,
        },
      });
      const msfaaNumber = createFakeMSFAANumber(
        {
          student,
        },
        {
          msfaaState: MSFAAStates.Signed,
        },
      );
      await db.msfaaNumber.save(msfaaNumber);

      // Mock user services to return the saved student.
      await mockUserLoginInfo(appModule, student);

      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        {
          student,
          msfaaNumber,
        },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.partTime,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          },
        },
      );

      application.currentAssessment.workflowData.calculatedData.pdppdStatus =
        true;
      await db.studentAssessment.save(application.currentAssessment);

      const endpoint = `/students/application/${application.id}/warnings`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          eCertFailedValidations: [
            ECertFailedValidation.DisabilityStatusNotConfirmed,
          ],
          canAcceptAssessment: false,
        });
    },
  );

  it(
    "Should return a failed ecert validations array with MSFAA not signed, cancelled and not valid when " +
      "the the MSFAA number is not signed and there is a cancelled date and the offering intensity is part time.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      const msfaaNumber = createFakeMSFAANumber(
        {
          student,
        },
        {
          msfaaState: MSFAAStates.Pending | MSFAAStates.CancelledOtherProvince,
        },
      );
      await db.msfaaNumber.save(msfaaNumber);

      // Mock user services to return the saved student.
      await mockUserLoginInfo(appModule, student);

      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        { student, msfaaNumber },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.partTime,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          },
        },
      );

      msfaaNumber.cancelledDate = getISODateOnlyString(new Date());
      await db.msfaaNumber.save(msfaaNumber);

      const endpoint = `/students/application/${application.id}/warnings`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          eCertFailedValidations: [
            ECertFailedValidation.MSFAACanceled,
            ECertFailedValidation.MSFAANotSigned,
          ],
          canAcceptAssessment: false,
        });
    },
  );

  it(
    "Should return a failed ecert validations array with stop disbursement restriction when " +
      "there are restrictions associated with the current student and the offering intensity is part time.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      const msfaaNumber = createFakeMSFAANumber(
        {
          student,
        },
        {
          msfaaState: MSFAAStates.Signed,
        },
      );
      await db.msfaaNumber.save(msfaaNumber);

      // Mock user services to return the saved student.
      await mockUserLoginInfo(appModule, student);

      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        { student, msfaaNumber },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.partTime,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          },
        },
      );

      const restriction = await db.restriction.findOne({
        where: {
          actionType: ArrayContains([
            RestrictionActionType.StopPartTimeDisbursement,
          ]),
        },
      });
      await saveFakeStudentRestriction(db.dataSource, {
        student,
        application,
        restriction,
      });

      const endpoint = `/students/application/${application.id}/warnings`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          eCertFailedValidations: [
            ECertFailedValidation.HasStopDisbursementRestriction,
          ],
          canAcceptAssessment: false,
        });
    },
  );

  it("Should return a failed ecert validations array with no estimated award amounts when no disbursements values are present.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const msfaaNumber = createFakeMSFAANumber(
      {
        student,
      },
      {
        msfaaState: MSFAAStates.Signed,
      },
    );
    await db.msfaaNumber.save(msfaaNumber);

    // Mock user services to return the saved student.
    await mockUserLoginInfo(appModule, student);

    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      { student, msfaaNumber, firstDisbursementValues: [] },
      {
        applicationStatus: ApplicationStatus.Completed,
        offeringIntensity: OfferingIntensity.partTime,
        firstDisbursementInitialValues: {
          coeStatus: COEStatus.completed,
          disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          hasEstimatedAwards: false,
        },
      },
    );

    const endpoint = `/students/application/${application.id}/warnings`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        eCertFailedValidations: [ECertFailedValidation.NoEstimatedAwardAmounts],
        canAcceptAssessment: false,
      });
  });

  it(
    "Should return a failed ecert validations array with no estimated award amounts when " +
      "disbursement values are present but the disbursements don't have estimated awards.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      const msfaaNumber = createFakeMSFAANumber(
        {
          student,
        },
        {
          msfaaState: MSFAAStates.Signed,
        },
      );
      await db.msfaaNumber.save(msfaaNumber);

      // Mock user services to return the saved student.
      await mockUserLoginInfo(appModule, student);

      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        {
          student,
          msfaaNumber,
          firstDisbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLP",
              0,
            ),
            createFakeDisbursementValue(
              DisbursementValueType.BCGrant,
              "BCAG",
              0,
            ),
          ],
        },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.partTime,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
            hasEstimatedAwards: false,
          },
        },
      );

      const endpoint = `/students/application/${application.id}/warnings`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          eCertFailedValidations: [
            ECertFailedValidation.NoEstimatedAwardAmounts,
          ],
          canAcceptAssessment: false,
        });
    },
  );

  it("Should throw a not found error when the application is not associated with the student.", async () => {
    // Arrange
    const application = await saveFakeApplication(appDataSource);
    const endpoint = `/students/application/${application.id}/warnings`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message:
          "Applications does not exists or the student does not have access to it.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
