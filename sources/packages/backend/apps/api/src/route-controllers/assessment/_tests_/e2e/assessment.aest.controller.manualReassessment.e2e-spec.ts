import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentAppeal,
  createFakeStudentAppealRequest,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  NoteType,
  StudentAssessmentStatus,
} from "@sims/sims-db";

describe("AssessmentAESTController(e2e)-manualReassessment", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should create a manual reassessment when requested.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource);
    application.currentAssessment.studentAssessmentStatus =
      StudentAssessmentStatus.Completed;
    const originalAssessment = application.currentAssessment;
    // Add an appeal to the application and current assessment/original assessment.
    const approvedAppealRequest = createFakeStudentAppealRequest();
    const approvedAppeal = createFakeStudentAppeal({
      application,
      studentAssessment: application.currentAssessment,
      appealRequests: [approvedAppealRequest],
    });
    const studentAppeal = await db.studentAppeal.save(approvedAppeal);
    application.currentAssessment.studentAppeal = studentAppeal;
    await db.application.save(application);

    const endpoint = `/aest/assessment/application/${application.id}/manual-reassessment`;
    const payload = { note: "Testing manual reassessment note." };
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    let responseReassessmentId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        responseReassessmentId = response.body.id;
        expect(responseReassessmentId).toEqual(expect.any(Number));
      });

    const applicationFromDb = await db.application.findOne({
      select: {
        id: true,
        currentAssessment: {
          id: true,
          offering: { id: true },
          studentAppeal: { id: true },
          triggerType: true,
          studentAssessmentStatus: true,
        },
        studentAssessments: {
          studentAssessmentStatus: true,
          offering: { id: true },
          studentAppeal: { id: true },
        },
        isArchived: true,
        applicationStatus: true,
      },
      relations: {
        currentAssessment: { offering: true, studentAppeal: true },
      },
      where: {
        id: application.id,
      },
    });

    const manualAssessment = applicationFromDb.currentAssessment;
    expect(manualAssessment).toEqual({
      id: responseReassessmentId,
      triggerType: AssessmentTriggerType.ManualReassessment,
      studentAssessmentStatus: StudentAssessmentStatus.Submitted,
      offering: { id: originalAssessment.offering.id },
      studentAppeal: { id: originalAssessment.studentAppeal.id },
    });

    const student = await db.student.findOne({
      select: { notes: true },
      relations: { notes: true },
      where: { id: application.student.id },
    });
    expect(student.notes).toEqual([
      {
        id: expect.any(Number),
        description: payload.note,
        noteType: NoteType.Application,
        updatedAt: expect.any(Date),
        createdAt: expect.any(Date),
      },
    ]);
  });

  it(`Should throw unprocessable entity when the original assessment does not have ${StudentAssessmentStatus.Completed} status.`, async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource);
    application.currentAssessment.studentAssessmentStatus =
      StudentAssessmentStatus.Cancelled;
    await db.application.save(application);

    const endpoint = `/aest/assessment/application/${application.id}/manual-reassessment`;
    const payload = {
      note: "Testing manual reassessment with a cancelled assessment.",
    };
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: `Application original assessment expected to be '${StudentAssessmentStatus.Completed}' to allow manual reassessment.`,
        error: "Unprocessable Entity",
      });
  });

  const unprocessableApplicationStatuses = [
    ApplicationStatus.Cancelled,
    ApplicationStatus.Draft,
  ];
  for (const unprocessableApplicationStatus of unprocessableApplicationStatuses) {
    it(`Should throw unprocessable entity when the application has ${unprocessableApplicationStatus} status.`, async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      application.applicationStatus = unprocessableApplicationStatus;
      await db.application.save(application);

      const endpoint = `/aest/assessment/application/${application.id}/manual-reassessment`;
      const payload = {
        note: "Testing manual reassessment with an application with unprocessable application status.",
      };
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect({
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: `Application cannot have manual reassessment in any of the statuses: ${ApplicationStatus.Cancelled} or ${ApplicationStatus.Draft}.`,
          error: "Unprocessable Entity",
        });
    });
  }

  it("Should throw unprocessable entity when the application is archived.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource);
    application.isArchived = true;
    await db.application.save(application);

    const endpoint = `/aest/assessment/application/${application.id}/manual-reassessment`;
    const payload = {
      note: "Testing manual reassessment with an archived application.",
    };
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message:
          "Application cannot have manual reassessment after being archived.",
        error: "Unprocessable Entity",
      });
  });

  it("Should throw not found when the application is not found.", async () => {
    // Arrange
    const endpoint =
      "/aest/assessment/application/99999999/manual-reassessment";
    const payload = {
      note: "Testing manual reassessment with an inexistent application.",
    };
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Application not found.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
