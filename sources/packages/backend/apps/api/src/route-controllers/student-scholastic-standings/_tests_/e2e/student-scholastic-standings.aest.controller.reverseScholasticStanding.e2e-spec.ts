import { HttpStatus, INestApplication } from "@nestjs/common";
import MockDate from "mockdate";
import {
  E2EDataSources,
  addOfferingVersion,
  createE2EDataSources,
  createFakeEducationProgramOffering,
  createFakeStudentAppeal,
  createFakeStudentAppealRequest,
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
  OfferingStatus,
  OfferingTypes,
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
    "Should reverse an active scholastic standing change, create a student note and send an email notification to the student for the same" +
      ` when the scholastic standing change type is ${StudentScholasticStandingChangeType.StudentDidNotCompleteProgram}`,
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

      // Assert the scholastic standing reversal and the scholastic standing reversal student notification.
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
      const scholasticStandingReversalNotification =
        await db.notification.findOne({
          select: {
            id: true,
            messagePayload: true,
            notificationMessage: { id: true, templateId: true },
          },
          where: {
            user: { id: application.student.user.id },
          },
          relations: { notificationMessage: true },
        });
      const ministryUser = await getAESTUser(
        db.dataSource,
        AESTGroups.BusinessAdministrators,
      );
      expect(reversedScholasticStanding).toEqual({
        id: scholasticStanding.id,
        reversalDate: now,
        reversalBy: { id: ministryUser.id },
        reversalNote: {
          id: expect.any(Number),
          noteType: NoteType.Application,
          description: payload.note,
        },
      });
      expect(scholasticStandingReversalNotification.messagePayload).toEqual({
        email_address: application.student.user.email,
        template_id:
          scholasticStandingReversalNotification.notificationMessage.templateId,
        personalisation: {
          givenNames: application.student.user.firstName,
          lastName: application.student.user.lastName,
          applicationNumber: application.applicationNumber,
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
    `Should reverse an active scholastic standing change and create a re-assessment of trigger type ${AssessmentTriggerType.ScholasticStandingReversal}` +
      " with the offering from most recent assessment before the scholastic standing change" +
      " and set the archive status to false and create a student note" +
      ` when the scholastic standing change type is ${StudentScholasticStandingChangeType.StudentWithdrewFromProgram}` +
      ` and the current assessment trigger type is ${AssessmentTriggerType.ScholasticStandingChange}.`,
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
        {
          initialValues: {
            studyStartDate,
            studyEndDate: withdrawalDate,
            parentOffering: offeringBeforeWithdrawal.parentOffering,
            offeringType: OfferingTypes.ScholasticStanding,
          },
        },
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
        reversalDate: now,
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
            studentAppeal: { id: true },
          },
        },
        relations: {
          currentAssessment: { offering: true, studentAppeal: true },
        },
        where: { id: application.id },
      });
      expect(updatedApplication).toEqual({
        id: application.id,
        isArchived: false,
        currentAssessment: {
          id: expect.any(Number),
          triggerType: AssessmentTriggerType.ScholasticStandingReversal,
          offering: { id: offeringBeforeWithdrawal.id },
          studentAppeal: null,
        },
      });
    },
  );

  it(
    `Should reverse an active scholastic standing change and create a re-assessment of trigger type ${AssessmentTriggerType.ScholasticStandingReversal}` +
      " with the offering from most recent assessment before the scholastic standing change" +
      " and set the archive status to false and create a student note" +
      ` when the scholastic standing change type is ${StudentScholasticStandingChangeType.StudentWithdrewFromProgram}` +
      ` and the current assessment trigger type is ${AssessmentTriggerType.RelatedApplicationChanged}.`,
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
        {
          initialValues: {
            studyStartDate,
            studyEndDate: withdrawalDate,
            parentOffering: offeringBeforeWithdrawal.parentOffering,
            offeringType: OfferingTypes.ScholasticStanding,
          },
        },
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
      // Create a related application change assessment.
      const relatedApplicationChangeAssessment = createFakeStudentAssessment(
        {
          auditUser: sharedUser,
          application,
          offering: withdrawalOffering,
        },
        {
          initialValue: {
            triggerType: AssessmentTriggerType.RelatedApplicationChanged,
          },
        },
      );
      application.currentAssessment = relatedApplicationChangeAssessment;
      await db.application.save(application);

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
        reversalDate: now,
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
            studentAppeal: { id: true },
          },
        },
        relations: {
          currentAssessment: { offering: true, studentAppeal: true },
        },
        where: { id: application.id },
      });
      expect(updatedApplication).toEqual({
        id: application.id,
        isArchived: false,
        currentAssessment: {
          id: expect.any(Number),
          triggerType: AssessmentTriggerType.ScholasticStandingReversal,
          offering: { id: offeringBeforeWithdrawal.id },
          studentAppeal: null,
        },
      });
    },
  );

  it(
    `Should reverse an active scholastic standing change and create a re-assessment of trigger type ${AssessmentTriggerType.ScholasticStandingReversal}` +
      " with the offering from most recent assessment before the scholastic standing change using the current offering version" +
      " and set the archive status to false and create a student note" +
      ` when the scholastic standing change type is ${StudentScholasticStandingChangeType.StudentWithdrewFromProgram}` +
      ` and the current assessment trigger type is ${AssessmentTriggerType.ScholasticStandingChange}` +
      " and the offering from most recent assessment before the scholastic standing had a change that is approved.",
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
        {
          initialValues: {
            studyStartDate,
            studyEndDate: withdrawalDate,
            parentOffering: offeringBeforeWithdrawal.parentOffering,
            offeringType: OfferingTypes.ScholasticStanding,
          },
        },
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

      // Add a new version which is approved for the offering before withdrawal.
      const { versionOffering } = await addOfferingVersion(
        db,
        offeringBeforeWithdrawal,
      );

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
        reversalDate: now,
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
            studentAppeal: { id: true },
          },
        },
        relations: {
          currentAssessment: { offering: true, studentAppeal: true },
        },
        where: { id: application.id },
      });
      expect(updatedApplication).toEqual({
        id: application.id,
        isArchived: false,
        currentAssessment: {
          id: expect.any(Number),
          triggerType: AssessmentTriggerType.ScholasticStandingReversal,
          offering: { id: versionOffering.id },
          studentAppeal: null,
        },
      });
    },
  );

  it(
    `Should reverse an active scholastic standing change and create a re-assessment of trigger type ${AssessmentTriggerType.ScholasticStandingReversal}` +
      " with the offering from most recent assessment before the scholastic standing change using the current offering version" +
      " and set the archive status to false and create a student note" +
      ` when the scholastic standing change type is ${StudentScholasticStandingChangeType.StudentWithdrewFromProgram}` +
      ` and the current assessment trigger type is ${AssessmentTriggerType.ScholasticStandingChange}` +
      " and the offering from most recent assessment before the scholastic standing had a change that is under review.",
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
        {
          initialValues: {
            studyStartDate,
            studyEndDate: withdrawalDate,
            parentOffering: offeringBeforeWithdrawal.parentOffering,
            offeringType: OfferingTypes.ScholasticStanding,
          },
        },
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

      // Add a new version which is under review for the offering before withdrawal.
      await addOfferingVersion(db, offeringBeforeWithdrawal, {
        offeringStatus: OfferingStatus.ChangeUnderReview,
        versionOfferingStatus: OfferingStatus.ChangeAwaitingApproval,
      });

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
        reversalDate: now,
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
            studentAppeal: { id: true },
          },
        },
        relations: {
          currentAssessment: { offering: true, studentAppeal: true },
        },
        where: { id: application.id },
      });
      expect(updatedApplication).toEqual({
        id: application.id,
        isArchived: false,
        currentAssessment: {
          id: expect.any(Number),
          triggerType: AssessmentTriggerType.ScholasticStandingReversal,
          offering: { id: offeringBeforeWithdrawal.id },
          studentAppeal: null,
        },
      });
    },
  );

  it(
    `Should reverse an active scholastic standing change and create a re-assessment of trigger type ${AssessmentTriggerType.ScholasticStandingReversal}` +
      " with the offering from most recent assessment before the scholastic standing change" +
      " and with appeal from current assessment" +
      " and set the archive status to false and create a student note" +
      ` when the scholastic standing change type is ${StudentScholasticStandingChangeType.StudentWithdrewFromProgram}` +
      ` and the current assessment trigger type is ${AssessmentTriggerType.ScholasticStandingChange}.`,
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
        {
          initialValues: {
            studyStartDate,
            studyEndDate: withdrawalDate,
            parentOffering: offeringBeforeWithdrawal.parentOffering,
            offeringType: OfferingTypes.ScholasticStanding,
          },
        },
      );
      await db.educationProgramOffering.save(withdrawalOffering);
      // Create a student appeal with approved appeal request.
      const approvedAppealRequest = createFakeStudentAppealRequest();
      const studentAppeal = createFakeStudentAppeal({
        application,
        appealRequests: [approvedAppealRequest],
      });
      await db.studentAppeal.save(studentAppeal);
      // Create a new assessment using the withdrawal offering.
      const scholasticStandingAssessment = createFakeStudentAssessment(
        {
          auditUser: sharedUser,
          application,
          offering: withdrawalOffering,
          studentAppeal,
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
        reversalDate: now,
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
            studentAppeal: { id: true },
          },
        },
        relations: {
          currentAssessment: { offering: true, studentAppeal: true },
        },
        where: { id: application.id },
      });
      expect(updatedApplication).toEqual({
        id: application.id,
        isArchived: false,
        currentAssessment: {
          id: expect.any(Number),
          triggerType: AssessmentTriggerType.ScholasticStandingReversal,
          offering: { id: offeringBeforeWithdrawal.id },
          studentAppeal: { id: studentAppeal.id },
        },
      });
    },
  );

  it(
    `Should throw unprocessable entity error when scholastic standing reversal is requested for a scholastic standing change type ${StudentScholasticStandingChangeType.StudentWithdrewFromProgram}` +
      ` and the current assessment trigger type is ${AssessmentTriggerType.ManualReassessment} which is not among the allowed trigger types for scholastic standing reversal.`,
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
        {
          initialValues: {
            studyStartDate,
            studyEndDate: withdrawalDate,
            parentOffering: offeringBeforeWithdrawal.parentOffering,
            offeringType: OfferingTypes.ScholasticStanding,
          },
        },
      );
      await db.educationProgramOffering.save(withdrawalOffering);
      // Create a student appeal with approved appeal request.
      const approvedAppealRequest = createFakeStudentAppealRequest();
      const studentAppeal = createFakeStudentAppeal({
        application,
        appealRequests: [approvedAppealRequest],
      });
      await db.studentAppeal.save(studentAppeal);
      // Create a new assessment using the withdrawal offering.
      const scholasticStandingAssessment = createFakeStudentAssessment(
        {
          auditUser: sharedUser,
          application,
          offering: withdrawalOffering,
          studentAppeal,
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
      // Create a new  re-assessment with trigger type which is not allowed for scholastic standing reversal.
      const assessmentWithReversalNotAllowed = createFakeStudentAssessment(
        {
          auditUser: sharedUser,
          application,
          offering: withdrawalOffering,
          studentAppeal,
        },
        {
          initialValue: {
            triggerType: AssessmentTriggerType.ManualReassessment,
          },
        },
      );
      application.currentAssessment = assessmentWithReversalNotAllowed;
      await db.application.save(application);

      const endpoint = `/aest/scholastic-standing/${scholasticStanding.id}/reverse`;
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect({
          message:
            "Scholastic standing reversal is not allowed for change type Student withdrew from program as the current assessment trigger type is not among allowed trigger types Scholastic standing change, Related application changed Manual reassessment but Manual reassessment.",
          error: "Unprocessable Entity",
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
    },
  );

  it("Should throw unprocessable entity error when scholastic standing is already reversed.", async () => {
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
      {
        initialValues: {
          studyStartDate,
          studyEndDate: withdrawalDate,
          parentOffering: offeringBeforeWithdrawal.parentOffering,
          offeringType: OfferingTypes.ScholasticStanding,
        },
      },
    );
    await db.educationProgramOffering.save(withdrawalOffering);
    // Create a student appeal with approved appeal request.
    const approvedAppealRequest = createFakeStudentAppealRequest();
    const studentAppeal = createFakeStudentAppeal({
      application,
      appealRequests: [approvedAppealRequest],
    });
    await db.studentAppeal.save(studentAppeal);
    // Create a new assessment using the withdrawal offering.
    const scholasticStandingAssessment = createFakeStudentAssessment(
      {
        auditUser: sharedUser,
        application,
        offering: withdrawalOffering,
        studentAppeal,
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
    // Create a scholastic standing with the change type 'Student withdrew from program' which is already reversed.
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
          reversalDate: new Date(),
          reversalBy: sharedUser,
        },
      },
    );
    await db.studentScholasticStanding.save(scholasticStanding);

    const endpoint = `/aest/scholastic-standing/${scholasticStanding.id}/reverse`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: `Scholastic standing ${scholasticStanding.id} is already reversed.`,
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw not found error when scholastic standing is not found.", async () => {
    // Arrange
    const endpoint = "/aest/scholastic-standing/99999/reverse";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Scholastic standing 99999 not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it("Should throw forbidden error when ministry user does not have the required permission(s) to reverse a scholastic standing.", async () => {
    // Arrange
    const endpoint = "/aest/scholastic-standing/99999/reverse";
    const token = await getAESTToken(AESTGroups.Operations);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message: "Forbidden resource",
        error: "Forbidden",
        statusCode: HttpStatus.FORBIDDEN,
      });
  });
});
