import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import MockDate from "mockdate";
import {
  ApplicationStatus,
  Institution,
  InstitutionLocation,
  NotificationMessageType,
  OfferingIntensity,
  ProgramInfoStatus,
  User,
} from "@sims/sims-db";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  createFakeEducationProgramOffering,
  createFakeInstitutionLocation,
  createFakeSINValidation,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";
import { PROGRAM_INFO_STATUS } from "@sims/services/workflow/variables/assessment-gateway";
import { getPSTPDTDateTime } from "@sims/utilities";
import { IsNull } from "typeorm";

describe("ProgramInfoRequestInstitutionsController(e2e)-completeProgramInfoRequest", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeFLocation: InstitutionLocation;
  let collegeFUser: User;
  let zeebeClient: ZeebeGrpcClient;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    zeebeClient = app.get(ZeebeGrpcClient);
    let collegeF: Institution;
    ({ institution: collegeF, user: collegeFUser } =
      await getAuthRelatedEntities(
        db.dataSource,
        InstitutionTokenTypes.CollegeFUser,
      ));
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
  });

  beforeEach(async () => {
    MockDate.reset();
    // Mark all existing InstitutionCompletesPIR notifications as sent to isolate test assertions.
    await db.notification.update(
      {
        notificationMessage: {
          id: NotificationMessageType.InstitutionCompletesPIR,
        },
      },
      { dateSent: new Date() },
    );
  });

  it("Should complete the PIR, message the workflow and send a notification when the application requires a PIR and the selected offering is valid.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);
    const application = await saveFakeApplication(
      db.dataSource,
      { institutionLocation: collegeFLocation },
      {
        applicationStatus: ApplicationStatus.InProgress,
        offeringIntensity: OfferingIntensity.fullTime,
        pirStatus: ProgramInfoStatus.required,
      },
    );
    // Student SIN Validation.
    application.student.sinValidation = createFakeSINValidation({
      student: application.student,
    });
    await db.student.save(application.student);

    const offering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering(
        {
          auditUser: collegeFUser,
          institutionLocation: collegeFLocation,
        },
        {
          initialValues: {
            offeringIntensity: application.offeringIntensity,
            studyStartDate: application.programYear.startDate,
            studyEndDate: application.programYear.endDate,
          },
        },
      ),
    );
    const payload = { selectedOffering: offering.id };
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(getEndpoint(collegeFLocation.id, application.id))
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    const updatedApplication = await db.application.findOne({
      select: {
        id: true,
        pirStatus: true,
        pirAssessedBy: { id: true },
        pirAssessedDate: true,
        modifier: { id: true },
        updatedAt: true,
        currentAssessment: {
          id: true,
          offering: { id: true },
          modifier: { id: true },
          updatedAt: true,
        },
      },
      relations: {
        pirAssessedBy: true,
        modifier: true,
        currentAssessment: { offering: true, modifier: true },
      },
      where: { id: application.id },
    });
    expect(updatedApplication).toEqual({
      id: application.id,
      pirStatus: ProgramInfoStatus.completed,
      pirAssessedBy: { id: collegeFUser.id },
      pirAssessedDate: now,
      modifier: { id: collegeFUser.id },
      updatedAt: now,
      currentAssessment: {
        id: application.currentAssessment.id,
        offering: { id: offering.id },
        modifier: { id: collegeFUser.id },
        updatedAt: now,
      },
    });

    // Assert workflow message.
    expect(zeebeClient.publishMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationKey: application.id.toString(),
        name: "program-info-request-completed",
        variables: {
          [PROGRAM_INFO_STATUS]: ProgramInfoStatus.completed,
        },
      }),
    );

    // Assert notification.
    const createdNotification = await db.notification.findOne({
      select: { id: true, messagePayload: true },
      where: {
        notificationMessage: {
          id: NotificationMessageType.InstitutionCompletesPIR,
        },
        dateSent: IsNull(),
      },
    });
    expect(createdNotification.messagePayload).toStrictEqual({
      template_id: createdNotification.notificationMessage.templateId,
      email_address: application.student.user.email,
      personalisation: {
        date: `${getPSTPDTDateTime(now)} PST/PDT`,
        givenNames: application.student.user.firstName,
        lastName: application.student.user.lastName,
      },
    });
  });

  [
    {
      applicationStatus: ApplicationStatus.Edited,
      expectedResponse: {
        message: "Application not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      },
    },
    {
      applicationStatus: ApplicationStatus.Cancelled,
      expectedResponse: {
        message:
          "Not able to find an application that requires a PIR to be completed.",
        errorType: "PIR_REQUEST_NOT_FOUND_ERROR",
      },
    },
  ].forEach(({ applicationStatus, expectedResponse }) => {
    it(`Should throw not found error when the application requires a PIR and has ${applicationStatus} status.`, async () => {
      // Arrange
      const application = await saveFakeApplication(
        db.dataSource,
        { institutionLocation: collegeFLocation },
        {
          applicationStatus,
          offeringIntensity: OfferingIntensity.fullTime,
          pirStatus: ProgramInfoStatus.required,
        },
      );
      const offering = await db.educationProgramOffering.save(
        createFakeEducationProgramOffering(
          {
            auditUser: collegeFUser,
            institutionLocation: collegeFLocation,
          },
          {
            initialValues: {
              offeringIntensity: application.offeringIntensity,
              studyStartDate: application.programYear.startDate,
              studyEndDate: application.programYear.endDate,
            },
          },
        ),
      );
      const payload = { selectedOffering: offering.id };
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .patch(getEndpoint(collegeFLocation.id, application.id))
        .send(payload)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.NOT_FOUND)
        .expect(expectedResponse);
    });
  });

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Gets the endpoint to complete a PIR for an institution location.
 * @param locationId Institution location ID.
 * @param applicationId Application ID associated with the PIR.
 * @returns Endpoint to complete the PIR.
 */
function getEndpoint(locationId: number, applicationId: number): string {
  return `/institutions/location/${locationId}/program-info-request/application/${applicationId}/complete`;
}
