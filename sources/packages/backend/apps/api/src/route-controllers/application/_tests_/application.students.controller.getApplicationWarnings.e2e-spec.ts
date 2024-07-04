import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { ArrayContains, DataSource } from "typeorm";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  getStudentByFakeStudentUserType,
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
} from "@sims/test-utils";
import {
  ApplicationStatus,
  COEStatus,
  DisabilityStatus,
  DisbursementScheduleStatus,
  OfferingIntensity,
  RestrictionActionType,
  Student,
} from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import { ECertFailedValidation } from "@sims/integrations/services/disbursement-schedule/disbursement-schedule.models";

describe("ApplicationStudentsController(e2e)-getCompletedApplicationDetails", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let appDataSource: DataSource;
  let student: Student;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    appDataSource = dataSource;
    db = createE2EDataSources(dataSource);
    student = await getStudentByFakeStudentUserType(
      FakeStudentUsersTypes.FakeStudentUserType1,
      dataSource,
    );
  });

  it("Should still return when application is not in 'Completed' status.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      { student },
      { createSecondDisbursement: true },
    );
    const endpoint = `/students/application/${application.id}/get-application-warnings`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([]);
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

      const endpoint = `/students/application/${application.id}/get-application-warnings`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect([ECertFailedValidation.DisabilityStatusNotConfirmed]);
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

      const endpoint = `/students/application/${application.id}/get-application-warnings`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect([
          ECertFailedValidation.MSFAACanceled,
          ECertFailedValidation.MSFAANotSigned,
        ]);
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

      const endpoint = `/students/application/${application.id}/get-application-warnings`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect([ECertFailedValidation.HasStopDisbursementRestriction]);
    },
  );

  afterAll(async () => {
    await app?.close();
  });
});
