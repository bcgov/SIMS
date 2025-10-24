import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentAppeal,
  createFakeStudentAppealRequest,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  ModifiedIndependentStatus,
  NoteType,
  StudentAppealActionType,
  StudentAppealStatus,
} from "@sims/sims-db";
import { StudentAppealApprovalAPIInDTO } from "../../../../route-controllers";
import MockDate from "mockdate";

describe("StudentAppealAESTController(e2e)-approveStudentAppealRequests", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  const MODIFIED_INDEPENDENT_APPEAL = "modifiedindependentappeal";

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  beforeEach(async () => {
    MockDate.reset();
  });

  it("Should approve student appeal requests and add note when the appeal with appeal requests submitted for approval are in pending status.", async () => {
    // Arrange
    // Create a completed application to request change.
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      undefined,
      { applicationStatus: ApplicationStatus.Completed },
    );
    // Create pending student appeal.
    const appealRequest = createFakeStudentAppealRequest(
      { application },
      { initialValues: { appealStatus: StudentAppealStatus.Pending } },
    );
    const appeal = createFakeStudentAppeal({
      application,
      appealRequests: [appealRequest],
    });
    await db.studentAppeal.save(appeal);
    const [savedAppealRequest] = appeal.appealRequests;

    const endpoint = `/aest/appeal/${appeal.id}/requests`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload: StudentAppealApprovalAPIInDTO = {
      requests: [
        {
          id: savedAppealRequest.id,
          appealStatus: StudentAppealStatus.Approved,
          noteDescription: "Approved",
        },
      ],
    };

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({});
    // Check for the appeal and appeal requests in the database.
    const updatedAppeal = await db.studentAppeal.findOne({
      select: {
        id: true,
        appealRequests: {
          id: true,
          appealStatus: true,
          assessedBy: { id: true },
          note: { description: true, noteType: true },
        },
        studentAssessment: { id: true, triggerType: true },
      },
      relations: {
        appealRequests: { assessedBy: true, note: true },
        studentAssessment: true,
      },
      where: { id: appeal.id },
    });
    // Approving ministry user.
    const ministryUser = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
    // Assert updated appeal and appeal request.
    expect(updatedAppeal).toEqual({
      id: appeal.id,
      studentAssessment: {
        id: expect.any(Number),
        triggerType: AssessmentTriggerType.StudentAppeal,
      },
      appealRequests: [
        {
          id: savedAppealRequest.id,
          appealStatus: StudentAppealStatus.Approved,
          assessedBy: { id: ministryUser.id },
          note: { description: "Approved", noteType: NoteType.Application },
        },
      ],
    });
  });

  describe("Modified independent appeal", () => {
    for (const modifiedIndependentStatus of [
      ModifiedIndependentStatus.Approved,
      ModifiedIndependentStatus.Declined,
    ]) {
      it(`Should update the student profile modified independent status as ${modifiedIndependentStatus} when a valid modified independent appeal is assessed.`, async () => {
        // Arrange
        // Create a completed application to request change.
        const student = await saveFakeStudent(db.dataSource);
        // Create pending student appeal.
        const appealRequest = createFakeStudentAppealRequest(undefined, {
          initialValues: {
            appealStatus: StudentAppealStatus.Pending,
            submittedFormName: MODIFIED_INDEPENDENT_APPEAL,
            submittedData: {
              actions: [StudentAppealActionType.UpdateModifiedIndependent],
            },
          },
        });
        const appeal = createFakeStudentAppeal({
          student,
          appealRequests: [appealRequest],
        });
        await db.studentAppeal.save(appeal);
        const [savedAppealRequest] = appeal.appealRequests;
        const endpoint = `/aest/appeal/${appeal.id}/requests`;
        const token = await getAESTToken(AESTGroups.BusinessAdministrators);
        const appealStatus =
          modifiedIndependentStatus === ModifiedIndependentStatus.Approved
            ? StudentAppealStatus.Approved
            : StudentAppealStatus.Declined;
        const noteDescription = `Assessed as ${modifiedIndependentStatus}`;
        const payload: StudentAppealApprovalAPIInDTO = {
          requests: [
            {
              id: savedAppealRequest.id,
              appealStatus,
              noteDescription,
            },
          ],
        };
        const now = new Date();
        MockDate.set(now);

        // Act/Assert
        await request(app.getHttpServer())
          .patch(endpoint)
          .send(payload)
          .auth(token, BEARER_AUTH_TYPE)
          .expect(HttpStatus.OK)
          .expect({});
        // Check for the appeal and appeal requests in the database.
        const updatedAppeal = await db.studentAppeal.findOne({
          select: {
            id: true,
            student: {
              id: true,
              modifiedIndependentStatus: true,
              modifiedIndependentAppealRequest: { id: true },
              modifiedIndependentStatusUpdatedBy: { id: true },
              modifiedIndependentStatusUpdatedOn: true,
              modifier: { id: true },
              updatedAt: true,
            },
            appealRequests: {
              id: true,
              appealStatus: true,
              assessedBy: { id: true },
              modifier: { id: true },
              updatedAt: true,
              note: { id: true, description: true, noteType: true },
            },
            application: { id: true },
            studentAssessment: { id: true },
          },
          relations: {
            student: {
              modifiedIndependentAppealRequest: true,
              modifiedIndependentStatusUpdatedBy: true,
              modifier: true,
            },
            appealRequests: { assessedBy: true, note: true, modifier: true },
            application: true,
            studentAssessment: true,
          },
          where: { id: appeal.id },
          loadEagerRelations: false,
        });
        // Approving ministry user.
        const ministryUser = await getAESTUser(
          db.dataSource,
          AESTGroups.BusinessAdministrators,
        );
        // Assert updated appeal, appeal request, and student profile.
        const auditUser = { id: ministryUser.id };
        expect(updatedAppeal).toEqual({
          id: appeal.id,
          application: null,
          studentAssessment: null,
          student: {
            id: student.id,
            modifiedIndependentStatus,
            modifiedIndependentAppealRequest: { id: savedAppealRequest.id },
            modifiedIndependentStatusUpdatedBy: auditUser,
            modifiedIndependentStatusUpdatedOn: now,
            modifier: auditUser,
            updatedAt: now,
          },
          appealRequests: [
            {
              id: savedAppealRequest.id,
              appealStatus,
              assessedBy: auditUser,
              modifier: auditUser,
              updatedAt: now,
              note: {
                id: expect.any(Number),
                description: noteDescription,
                noteType: NoteType.General,
              },
            },
          ],
        });
      });
    }
  });

  afterAll(async () => {
    await app?.close();
  });
});
