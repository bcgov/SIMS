import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import { ApplicationEditStatus, ApplicationStatus, User } from "@sims/sims-db";
import * as faker from "faker";
import {
  createE2EDataSources,
  createFakeStudentAppeal,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";
import MockDate from "mockdate";

describe("ApplicationChangeRequestAESTController(e2e)-assessApplicationChangeRequest", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let zbClient: ZeebeGrpcClient;
  let db: E2EDataSources;
  let ministryUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    zbClient = app.get(ZeebeGrpcClient);
    db = createE2EDataSources(dataSource);
    const auditUser = await getAESTUser(
      dataSource,
      AESTGroups.BusinessAdministrators,
    );
    ministryUser = { id: auditUser.id } as User;
  });

  beforeEach(async () => {
    MockDate.reset();
  });

  it("Should approve a change request and copy the offering and appeal when the application change request is waiting for approval.", async () => {
    // Arrange
    // Application to be replaced by the change request.
    const applicationToBeReplaced = await saveFakeApplication(
      appDataSource,
      undefined,
      {
        initialValues: {
          applicationStatus: ApplicationStatus.Completed,
          applicationEditStatus: ApplicationEditStatus.Original,
        },
      },
    );
    // Create a student appeal and have it associated with the "applicationToBeReplaced".
    const appeal = createFakeStudentAppeal({
      application: applicationToBeReplaced,
    });
    applicationToBeReplaced.currentAssessment.studentAppeal = appeal;
    await db.application.save(applicationToBeReplaced);
    // Change request to be approved replacing the "applicationToBeReplaced".
    const changeRequest = await saveFakeApplication(
      appDataSource,
      { precedingApplication: applicationToBeReplaced },
      {
        initialValues: {
          applicationStatus: ApplicationStatus.Edited,
          applicationEditStatus: ApplicationEditStatus.ChangePendingApproval,
        },
      },
    );
    // Offering to perform the asserts. Expected to be copied.
    const expectedOffering = {
      id: applicationToBeReplaced.currentAssessment.offering.id,
    };
    // Appeal to perform the asserts. Expected to be copied.
    const expectedAppeal = { id: appeal.id };
    const payload = getPayload(ApplicationEditStatus.ChangedWithApproval);
    const endpoint = `/aest/application-change-request/${changeRequest.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const now = new Date();
    MockDate.set(now);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    // Validate workflow message.
    expect(zbClient.publishMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationKey: changeRequest.id.toString(),
        name: "application-change-request-status-message",
        variables: {
          applicationEditStatus: ApplicationEditStatus.ChangedWithApproval,
        },
      }),
    );
    // Validate database changes.
    const applicationChangeRequest = await db.application.findOne({
      select: {
        id: true,
        applicationStatus: true,
        applicationStatusUpdatedOn: true,
        currentAssessment: {
          id: true,
          offering: {
            id: true,
          },
          studentAppeal: {
            id: true,
          },
        },
        modifier: {
          id: true,
        },
        updatedAt: true,
        precedingApplication: {
          id: true,
          applicationStatus: true,
          applicationStatusUpdatedOn: true,
          applicationEditStatus: true,
          applicationEditStatusUpdatedOn: true,
          currentAssessment: {
            id: true,
            offering: {
              id: true,
            },
            studentAppeal: {
              id: true,
            },
          },
          modifier: {
            id: true,
          },
          updatedAt: true,
        },
      },
      relations: {
        currentAssessment: {
          offering: true,
          studentAppeal: true,
        },
        modifier: true,
        precedingApplication: {
          currentAssessment: {
            offering: true,
            studentAppeal: true,
          },
          modifier: true,
        },
      },
      where: {
        id: changeRequest.id,
      },
      loadEagerRelations: false,
    });
    expect(applicationChangeRequest).toEqual({
      id: changeRequest.id,
      applicationStatus: ApplicationStatus.Completed,
      applicationStatusUpdatedOn: now,
      currentAssessment: {
        id: expect.any(Number),
        offering: expectedOffering,
        studentAppeal: expectedAppeal,
      },
      modifier: ministryUser,
      updatedAt: now,
      precedingApplication: {
        id: applicationToBeReplaced.id,
        applicationStatus: ApplicationStatus.Edited,
        applicationStatusUpdatedOn: now,
        // Ensure value was not updated.
        applicationEditStatus: applicationToBeReplaced.applicationEditStatus,
        // Ensure value was not updated.
        applicationEditStatusUpdatedOn:
          applicationToBeReplaced.applicationEditStatusUpdatedOn,
        currentAssessment: {
          id: applicationToBeReplaced.currentAssessment.id,
          offering: expectedOffering,
          studentAppeal: expectedAppeal,
        },
        modifier: ministryUser,
        updatedAt: now,
      },
    });
    // Validate created student note.
    const student = await db.student.findOne({
      select: {
        id: true,
        notes: { id: true, description: true, creator: { id: true } },
      },
      relations: {
        notes: { creator: true },
      },
      where: {
        id: changeRequest.student.id,
      },
      loadEagerRelations: false,
    });
    expect(student.notes).toEqual([
      {
        id: expect.any(Number),
        description: payload.note,
        creator: ministryUser,
      },
    ]);
  });

  it("Should approve a change request and copy the offering and no appeals when the application change request is waiting for approval and no appeals are present.", async () => {
    // Arrange
    // Application to be replaced by the change request.
    const applicationToBeReplaced = await saveFakeApplication(
      appDataSource,
      undefined,
      {
        initialValues: {
          applicationStatus: ApplicationStatus.Completed,
          applicationEditStatus: ApplicationEditStatus.Original,
        },
      },
    );
    // Change request to be approved replacing the "applicationToBeReplaced".
    const changeRequest = await saveFakeApplication(
      appDataSource,
      { precedingApplication: applicationToBeReplaced },
      {
        initialValues: {
          applicationStatus: ApplicationStatus.Edited,
          applicationEditStatus: ApplicationEditStatus.ChangePendingApproval,
        },
      },
    );
    // Offering to perform the asserts. Expected to be copied.
    const expectedOffering = {
      id: applicationToBeReplaced.currentAssessment.offering.id,
    };
    // Appeal to perform the asserts. Expected to be copied.
    const payload = getPayload(ApplicationEditStatus.ChangedWithApproval);
    const endpoint = `/aest/application-change-request/${changeRequest.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const now = new Date();
    MockDate.set(now);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    // Validate database changes.
    const applicationChangeRequest = await db.application.findOne({
      select: {
        id: true,
        currentAssessment: {
          id: true,
          offering: {
            id: true,
          },
          studentAppeal: {
            id: true,
          },
        },
        precedingApplication: {
          id: true,
          currentAssessment: {
            id: true,
            offering: {
              id: true,
            },
            studentAppeal: {
              id: true,
            },
          },
        },
      },
      relations: {
        currentAssessment: {
          offering: true,
          studentAppeal: true,
        },
        precedingApplication: {
          currentAssessment: {
            offering: true,
            studentAppeal: true,
          },
        },
      },
      where: {
        id: changeRequest.id,
      },
      loadEagerRelations: false,
    });
    // Focus on offering and appeal validation only.
    expect(applicationChangeRequest).toEqual(
      expect.objectContaining({
        id: changeRequest.id,
        currentAssessment: {
          id: expect.any(Number),
          offering: expectedOffering,
          studentAppeal: null,
        },
        precedingApplication: {
          id: applicationToBeReplaced.id,
          currentAssessment: {
            id: applicationToBeReplaced.currentAssessment.id,
            offering: expectedOffering,
            studentAppeal: null,
          },
        },
      }),
    );
  });

  it("Should be able to decline a change request and create a student note when the application change request is waiting for approval.", async () => {
    // Arrange
    // Change request to be approved replacing the "applicationToBeReplaced".
    const changeRequest = await saveFakeApplication(appDataSource, undefined, {
      initialValues: {
        applicationStatus: ApplicationStatus.Edited,
        applicationEditStatus: ApplicationEditStatus.ChangePendingApproval,
      },
    });
    // Appeal to perform the asserts. Expected to be copied.
    const payload = getPayload(ApplicationEditStatus.ChangeDeclined);
    const endpoint = `/aest/application-change-request/${changeRequest.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const now = new Date();
    MockDate.set(now);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    // Validate workflow message.
    expect(zbClient.publishMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationKey: changeRequest.id.toString(),
        name: "application-change-request-status-message",
        variables: {
          applicationEditStatus: ApplicationEditStatus.ChangeDeclined,
        },
      }),
    );
    // Validate database changes.
    const applicationChangeRequest = await db.application.findOne({
      select: {
        id: true,
        applicationEditStatus: true,
        applicationEditStatusUpdatedBy: { id: true },
        applicationEditStatusUpdatedOn: true,
        modifier: {
          id: true,
        },
        updatedAt: true,
      },
      relations: {
        applicationEditStatusUpdatedBy: true,
        modifier: true,
      },
      where: {
        id: changeRequest.id,
      },
      loadEagerRelations: false,
    });
    expect(applicationChangeRequest).toEqual({
      id: changeRequest.id,
      applicationEditStatus: ApplicationEditStatus.ChangeDeclined,
      applicationEditStatusUpdatedBy: ministryUser,
      applicationEditStatusUpdatedOn: now,
      modifier: ministryUser,
      updatedAt: now,
    });
    // Validate created student note.
    const student = await db.student.findOne({
      select: {
        id: true,
        notes: { id: true, description: true, creator: { id: true } },
      },
      relations: {
        notes: { creator: true },
      },
      where: {
        id: changeRequest.student.id,
      },
      loadEagerRelations: false,
    });
    expect(student.notes).toEqual([
      {
        id: expect.any(Number),
        description: payload.note,
        creator: ministryUser,
      },
    ]);
  });

  it("Should throw UnprocessableEntityException when the application change request was cancelled.", async () => {
    // Arrange
    const changeRequest = await saveFakeApplication(appDataSource, undefined, {
      initialValues: {
        applicationStatus: ApplicationStatus.Edited,
        applicationEditStatus: ApplicationEditStatus.ChangeCancelled,
      },
    });
    const endpoint = `/aest/application-change-request/${changeRequest.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = getPayload(ApplicationEditStatus.ChangedWithApproval);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: `Application ${changeRequest.id} to assess change not in valid status to be updated.`,
        errorType: "INVALID_APPLICATION_EDIT_STATUS",
      });
  });

  it("Should throw NotFoundException when the application change request does not exists.", async () => {
    // Arrange
    const endpoint = "/aest/application-change-request/999999";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = getPayload(ApplicationEditStatus.ChangedWithApproval);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Application 999999 to assess change not found.`,
        error: "Not Found",
      });
  });

  function getPayload(applicationEditStatus: ApplicationEditStatus) {
    return {
      note: faker.datatype.uuid(),
      applicationEditStatus,
    };
  }

  afterAll(async () => {
    await app?.close();
  });
});
