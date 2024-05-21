import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  getStudentByFakeStudentUserType,
} from "../../../testHelpers";
import {
  saveFakeApplicationDisbursements,
  createE2EDataSources,
  E2EDataSources,
  saveFakeStudentRestriction,
  createFakeMSFAANumber,
} from "@sims/test-utils";
import {
  Application,
  ApplicationStatus,
  AssessmentTriggerType,
  DisabilityStatus,
  DisbursementSchedule,
  RestrictionActionType,
  Student,
} from "@sims/sims-db";
import { ArrayContains } from "typeorm";
import { getISODateOnlyString } from "@sims/utilities";

describe("ApplicationStudentsController(e2e)-getEnrolmentApplicationDetails", () => {
  let app: INestApplication;
  let student: Student;
  let db: E2EDataSources;
  let application: Application;
  let firstDisbursement: DisbursementSchedule;
  let secondDisbursement: DisbursementSchedule;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    student = await getStudentByFakeStudentUserType(
      FakeStudentUsersTypes.FakeStudentUserType1,
      dataSource,
    );
    application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        applicationStatus: ApplicationStatus.Enrolment,
        createSecondDisbursement: true,
      },
    );
    [firstDisbursement, secondDisbursement] =
      application.currentAssessment.disbursementSchedules;
  });

  beforeEach(async () => {
    // Remove student restriction records associated with the student before each test case.
    const queryStudentRestrictions = await db.studentRestriction.find({
      select: { id: true },
      relations: { student: true },
      where: {
        student: { id: student.id },
      },
    });
    db.studentRestriction.remove(queryStudentRestrictions);
    application.currentAssessment.triggerType =
      AssessmentTriggerType.OriginalAssessment;
    await db.application.save(application);
  });

  it("Should get application enrolment details when the current assessment trigger type is 'Related application changed'.", async () => {
    // Arrange
    application.currentAssessment.triggerType =
      AssessmentTriggerType.RelatedApplicationChanged;
    await db.application.save(application);

    const endpoint = `/students/application/${application.id}/enrolment`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body.firstDisbursement).toStrictEqual({
          coeStatus: firstDisbursement.coeStatus,
          disbursementScheduleStatus:
            firstDisbursement.disbursementScheduleStatus,
        });
        expect(response.body.secondDisbursement).toStrictEqual({
          coeStatus: secondDisbursement.coeStatus,
          disbursementScheduleStatus:
            secondDisbursement.disbursementScheduleStatus,
        });
        expect(response.body.assessmentTriggerType).toBe(
          AssessmentTriggerType.RelatedApplicationChanged,
        );
      });
  });

  it("Should get application enrolment details when disability status is verified.", async () => {
    // Arrange
    application.currentAssessment.workflowData.calculatedData.pdppdStatus =
      true;
    application.student.disabilityStatus = DisabilityStatus.PD;
    await db.application.save(application);

    const endpoint = `/students/application/${application.id}/enrolment`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body.firstDisbursement).toStrictEqual({
          coeStatus: firstDisbursement.coeStatus,
          disbursementScheduleStatus:
            firstDisbursement.disbursementScheduleStatus,
        });
        expect(response.body.secondDisbursement).toStrictEqual({
          coeStatus: secondDisbursement.coeStatus,
          disbursementScheduleStatus:
            secondDisbursement.disbursementScheduleStatus,
        });
        expect(response.body.assessmentTriggerType).toBe(
          AssessmentTriggerType.OriginalAssessment,
        );
        expect(response.body.verifiedDisabilityStatus).toBeTruthy;
      });
  });

  it("Should get application enrolment details when the student has valid MSFAA status.", async () => {
    // Arrange
    const msfaaNumber = createFakeMSFAANumber(
      {
        student,
        referenceApplication: application,
      },
      { msfaaInitialValues: { dateSigned: getISODateOnlyString(new Date()) } },
    );
    db.msfaaNumber.save(msfaaNumber);

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

    const endpoint = `/students/application/${application.id}/enrolment`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body.firstDisbursement).toStrictEqual({
          coeStatus: firstDisbursement.coeStatus,
          disbursementScheduleStatus:
            firstDisbursement.disbursementScheduleStatus,
        });
        expect(response.body.secondDisbursement).toStrictEqual({
          coeStatus: secondDisbursement.coeStatus,
          disbursementScheduleStatus:
            secondDisbursement.disbursementScheduleStatus,
        });
        expect(response.body.assessmentTriggerType).toBe(
          AssessmentTriggerType.OriginalAssessment,
        );
        expect(response.body.hasValidMSFAAStatus).toBeTruthy;
      });
  });

  it("Should get application enrolment details when there are restrictions associated with the current student.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        applicationStatus: ApplicationStatus.Enrolment,
        createSecondDisbursement: true,
      },
    );
    const [firstDisbursement, secondDisbursement] =
      application.currentAssessment.disbursementSchedules;

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

    const endpoint = `/students/application/${application.id}/enrolment`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body.firstDisbursement).toStrictEqual({
          coeStatus: firstDisbursement.coeStatus,
          disbursementScheduleStatus:
            firstDisbursement.disbursementScheduleStatus,
        });
        expect(response.body.secondDisbursement).toStrictEqual({
          coeStatus: secondDisbursement.coeStatus,
          disbursementScheduleStatus:
            secondDisbursement.disbursementScheduleStatus,
        });
        expect(response.body.assessmentTriggerType).toBe(
          AssessmentTriggerType.OriginalAssessment,
        );
        expect(response.body.hasRestriction).toBeTruthy;
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
