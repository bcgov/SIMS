import { HttpStatus, INestApplication } from "@nestjs/common";
import MockDate from "mockdate";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeEducationProgramOffering,
  createFakeStudentAssessment,
  createFakeStudentScholasticStanding,
  createFakeUser,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import * as request from "supertest";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  NoteType,
  StudentScholasticStandingChangeType,
  User,
} from "@sims/sims-db";
import { addDays, getISODateOnlyString } from "@sims/utilities";

describe("StudentScholasticStandingsAESTController(e2e)-reverseScholasticStanding.", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  const payload = { note: "Reversal note" };
  let sharedUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sharedUser = await db.user.save(createFakeUser());
  });

  afterEach(async () => {
    // Reset the current date mock.
    MockDate.reset();
  });

  it(
    "Should reverse an active scholastic standing change and create a student note" +
      ` when the scholastic standing change type is ${StudentScholasticStandingChangeType.StudentDidNotCompleteProgram}.`,
    async () => {
      // Arrange
      // Create an application with a completed status to have a scholastic standing associated with it.
      const application = await saveFakeApplication(db.dataSource, undefined, {
        applicationStatus: ApplicationStatus.Completed,
      });

      // Create a scholastic standing with the change type 'Student did not complete program'.
      const scholasticStanding = createFakeStudentScholasticStanding(
        {
          submittedBy: sharedUser,
          application,
        },
        {
          initialValues: {
            changeType:
              StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
          },
        },
      );
      await db.studentScholasticStanding.save(scholasticStanding);

      const endpoint = `/aest/scholastic-standing/${scholasticStanding.id}/reverse`;
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      const now = new Date();
      // Mock the current date to validate the reversal date.
      MockDate.set(now);

      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({});

      // Assert the scholastic standing reversal.
      const reversedScholasticStanding =
        await db.studentScholasticStanding.findOne({
          select: {
            id: true,
            reversalDate: true,
            reversalBy: { id: true },
            reversalNote: { id: true, noteType: true, description: true },
          },
          relations: { reversalBy: true, reversalNote: true },
          where: { id: scholasticStanding.id },
        });

      const ministryUser = await getAESTUser(
        db.dataSource,
        AESTGroups.BusinessAdministrators,
      );
      expect(reversedScholasticStanding).toEqual({
        id: scholasticStanding.id,
        reversalDate: now.toISOString(),
        reversalBy: { id: ministryUser.id },
        reversalNote: {
          id: expect.any(Number),
          noteType: NoteType.Application,
          description: payload.note,
        },
      });

      // Assert that the note is created for the application student.
      const studentWithNote = await db.student.findOne({
        select: { id: true, notes: { id: true } },
        relations: { notes: true },
        where: { id: application.student.id },
      });

      expect(studentWithNote.notes).toEqual([
        { id: reversedScholasticStanding.reversalNote.id },
      ]);
    },
  );

  it(
    `Should reverse an active scholastic standing change and create a re-assessment of trigger type ${AssessmentTriggerType.ScholasticStandingChange}` +
      " with the offering from most recent assessment before the scholastic standing change" +
      ` and set the archive status to false and create a student note` +
      ` when the scholastic standing change type is ${StudentScholasticStandingChangeType.StudentWithdrewFromProgram}` +
      ` the current assessment trigger type is ${AssessmentTriggerType.ScholasticStandingChange}.`,
    async () => {
      // Arrange
      // Define the actual study period dates.
      const studyStartDate = getISODateOnlyString(new Date());
      const studyEndDate = getISODateOnlyString(addDays(60));
      // Create an application with a completed status to have a scholastic standing associated with it.
      const application = await saveFakeApplication(db.dataSource, undefined, {
        applicationStatus: ApplicationStatus.Completed,
        offeringInitialValues: { studyStartDate, studyEndDate },
      });
      const offeringBeforeWithdrawal = application.currentAssessment.offering;

      // Create an offering for withdrawal.
      const withdrawalDate = getISODateOnlyString(addDays(-10, studyEndDate));
      const withdrawalOffering = createFakeEducationProgramOffering(
        {
          auditUser: sharedUser,
        },
        { initialValues: { studyStartDate, studyEndDate: withdrawalDate } },
      );
      await db.educationProgramOffering.save(withdrawalOffering);
      // Create a new assessment using the withdrawal offering.
      const scholasticStandingAssessment = createFakeStudentAssessment(
        {
          auditUser: sharedUser,
          application,
          offering: withdrawalOffering,
        },
        {
          initialValue: {
            triggerType: AssessmentTriggerType.ScholasticStandingChange,
          },
        },
      );
      application.currentAssessment = scholasticStandingAssessment;
      application.isArchived = true;
      await db.application.save(application);
      // Create a scholastic standing with the change type 'Student withdrew from program'.
      const scholasticStanding = createFakeStudentScholasticStanding(
        {
          submittedBy: sharedUser,
          application,
        },
        {
          initialValues: {
            changeType:
              StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
            referenceOffering: offeringBeforeWithdrawal,
          },
        },
      );
      await db.studentScholasticStanding.save(scholasticStanding);

      const endpoint = `/aest/scholastic-standing/${scholasticStanding.id}/reverse`;
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      const now = new Date();
      // Mock the current date to validate the reversal date.
      MockDate.set(now);

      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({});

      // Assert the scholastic standing reversal.
      const reversedScholasticStanding =
        await db.studentScholasticStanding.findOne({
          select: {
            id: true,
            reversalDate: true,
            reversalBy: { id: true },
            reversalNote: { id: true, noteType: true, description: true },
          },
          relations: { reversalBy: true, reversalNote: true },
          where: { id: scholasticStanding.id },
        });
      const ministryUser = await getAESTUser(
        db.dataSource,
        AESTGroups.BusinessAdministrators,
      );
      expect(reversedScholasticStanding).toEqual({
        id: scholasticStanding.id,
        reversalDate: now.toISOString(),
        reversalBy: { id: ministryUser.id },
        reversalNote: {
          id: expect.any(Number),
          noteType: NoteType.Application,
          description: payload.note,
        },
      });

      // Assert that the note is created for the application student.
      const studentWithNote = await db.student.findOne({
        select: { id: true, notes: { id: true } },
        relations: { notes: true },
        where: { id: application.student.id },
      });

      expect(studentWithNote.notes).toEqual([
        { id: reversedScholasticStanding.reversalNote.id },
      ]);

      // Assert the re-assessment creation, offering and archive status.
      const updatedApplication = await db.application.findOne({
        select: {
          id: true,
          isArchived: true,
          currentAssessment: {
            id: true,
            triggerType: true,
            offering: { id: true },
          },
        },
        relations: { currentAssessment: { offering: true } },
        where: { id: application.id },
      });
      expect(updatedApplication).toEqual({
        id: application.id,
        isArchived: false,
        currentAssessment: {
          id: expect.any(Number),
          triggerType: AssessmentTriggerType.ScholasticStandingReversal,
          offering: { id: offeringBeforeWithdrawal.id },
        },
      });
    },
  );
});
