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
} from "@sims/test-utils";
import { ApplicationStatus, StudentAppealStatus } from "@sims/sims-db";
import { StudentAppealApprovalAPIInDTO } from "apps/api/src/route-controllers/student-appeal/models/student-appeal.dto";

describe("StudentAppealAESTController(e2e)-approveStudentAppealRequests", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
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
          note: { description: true },
        },
      },
      relations: { appealRequests: { assessedBy: true, note: true } },
      where: { id: appeal.id },
    });
    // Approving ministry user.
    const ministryUser = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
    // Asset updated appeal and appeal request.
    expect(updatedAppeal).toEqual({
      id: appeal.id,
      appealRequests: [
        {
          id: savedAppealRequest.id,
          appealStatus: StudentAppealStatus.Approved,
          assessedBy: { id: ministryUser.id },
          note: { description: "Approved" },
        },
      ],
    });
  });

  afterAll(async () => {
    await app?.close();
  });
});
