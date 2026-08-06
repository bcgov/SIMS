import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import MockDate from "mockdate";
import {
  Application,
  ApplicationData,
  ApplicationStatus,
  Institution,
  InstitutionLocation,
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
  createFakeEducationProgram,
  createFakeInstitutionLocation,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { PIR_DENIED_REASON_OTHER_ID } from "../../../../utilities";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";
import { PROGRAM_INFO_STATUS } from "@sims/services/workflow/variables/assessment-gateway";

describe("ProgramInfoRequestInstitutionsController(e2e)-denyProgramInfoRequest", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeFLocation: InstitutionLocation;
  let zeebeClient: ZeebeGrpcClient;
  let collegeFUser: User;

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

  beforeEach(() => {
    MockDate.reset();
  });

  it("Should deny the PIR and notify the workflow when the application requires a PIR.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);
    // Dynamic data used to retrieve PIR information when no offering was provided.
    const applicationData = {
      workflowName: "workflowName",
      studystartDate: getISODateOnlyString(addDays(-30)),
      studyendDate: getISODateOnlyString(addDays(30)),
    } as ApplicationData;
    const pirProgram = await db.educationProgram.save(
      createFakeEducationProgram({ auditUser: collegeFUser }),
    );
    // Application with PIR required.
    const application = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
        pirProgram: pirProgram,
      },
      {
        pirStatus: ProgramInfoStatus.required,
        applicationStatus: ApplicationStatus.InProgress,
        applicationData,
      },
    );
    application.currentAssessment.assessmentWorkflowId =
      "test-assessment-workflow-id";
    await db.studentAssessment.save(application.currentAssessment);
    const payload = {
      pirDenyReasonId: PIR_DENIED_REASON_OTHER_ID,
      otherReasonDesc: "The institution could not confirm the program.",
    };
    // Institution token.
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
        pirDeniedReasonId: { id: true },
        pirDeniedOtherDesc: true,
        pirAssessedBy: { id: true },
        pirAssessedDate: true,
        modifier: { id: true },
        updatedAt: true,
      },
      relations: {
        pirDeniedReasonId: true,
        pirAssessedBy: true,
        modifier: true,
      },
      where: { id: application.id },
    });
    expect(updatedApplication).toEqual({
      id: application.id,
      pirStatus: ProgramInfoStatus.declined,
      pirDeniedReasonId: { id: payload.pirDenyReasonId },
      pirDeniedOtherDesc: payload.otherReasonDesc,
      pirAssessedBy: { id: collegeFUser.id },
      pirAssessedDate: now,
      modifier: { id: collegeFUser.id },
      updatedAt: now,
    } as Application);

    // Assert workflow message.
    expect(zeebeClient.publishMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationKey: application.id.toString(),
        name: "program-info-request-completed",
        variables: {
          [PROGRAM_INFO_STATUS]: ProgramInfoStatus.declined,
        },
      }),
    );
  });

  [ApplicationStatus.Edited, ApplicationStatus.Cancelled].forEach(
    (applicationStatus) => {
      it(`Should throw not found error when the application the application requires a PIR  and has ${applicationStatus} status.`, async () => {
        // Arrange
        // Dynamic data used to retrieve PIR information when no offering was provided.
        const applicationData = {
          workflowName: "workflowName",
          studystartDate: getISODateOnlyString(addDays(-30)),
          studyendDate: getISODateOnlyString(addDays(30)),
        } as ApplicationData;
        const pirProgram = await db.educationProgram.save(
          createFakeEducationProgram({ auditUser: collegeFUser }),
        );
        // Application with PIR required.
        const application = await saveFakeApplication(
          db.dataSource,
          {
            institutionLocation: collegeFLocation,
            pirProgram: pirProgram,
          },
          {
            pirStatus: ProgramInfoStatus.required,
            applicationStatus: applicationStatus,
            applicationData,
          },
        );
        const payload = {
          pirDenyReasonId: PIR_DENIED_REASON_OTHER_ID,
          otherReasonDesc: "The institution could not confirm the program.",
        };
        // Institution token.
        const institutionUserToken = await getInstitutionToken(
          InstitutionTokenTypes.CollegeFUser,
        );
        const endpoint = getEndpoint(collegeFLocation.id, application.id);

        // Act/Assert
        await request(app.getHttpServer())
          .patch(endpoint)
          .send(payload)
          .auth(institutionUserToken, BEARER_AUTH_TYPE)
          .expect(HttpStatus.NOT_FOUND)
          .expect({
            statusCode: HttpStatus.NOT_FOUND,
            message:
              "Not able to find an application that requires a PIR to be completed.",
            error: "Not Found",
          });
      });
    },
  );

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Gets the endpoint to deny a PIR for an institution location.
 * @param locationId Institution location ID.
 * @param applicationId Application ID associated with the PIR.
 * @returns Endpoint to deny the PIR.
 */
function getEndpoint(locationId: number, applicationId: number): string {
  return `/institutions/location/${locationId}/program-info-request/application/${applicationId}/deny`;
}
