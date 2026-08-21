import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getExpectedOfferingNameAndPeriod,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import {
  createFakeInstitutionLocation,
  E2EDataSources,
  createE2EDataSources,
  saveFakeApplicationOfferingRequestChange,
} from "@sims/test-utils";
import { InstitutionLocation } from "@sims/sims-db";
import { getUserFullName } from "../../../../utilities";

describe("ApplicationOfferingChangeRequestInstitutionsController(e2e)-getApplicationOfferingChangeRequest", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeFLocation: InstitutionLocation;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    // College F.
    const { institution: collegeF } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
  });

  it("Should get the application offering change request when application offering change request exists.", async () => {
    // Arrange
    const applicationOfferingChange =
      await saveFakeApplicationOfferingRequestChange(db, {
        institutionLocation: collegeFLocation,
      });
    const application = applicationOfferingChange.application;
    const requestedOffering = applicationOfferingChange.requestedOffering;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint(collegeFLocation.id, applicationOfferingChange.id))
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual({
          id: applicationOfferingChange.id,
          applicationId: application.id,
          status:
            applicationOfferingChange.applicationOfferingChangeRequestStatus,
          applicationNumber: application.applicationNumber,
          locationName: collegeFLocation.name,
          requestedOfferingId: requestedOffering.id,
          activeOfferingId: applicationOfferingChange.activeOffering.id,
          reason: applicationOfferingChange.reason,
          requestedOfferingDescription:
            getExpectedOfferingNameAndPeriod(requestedOffering),
          requestedOfferingProgramId: requestedOffering.educationProgram.id,
          requestedOfferingProgramName: requestedOffering.educationProgram.name,
          studentFullName: getUserFullName(application.student.user),
        }),
      );
  });

  it("Should throw not found exception when application offering change request does not exist.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint(collegeFLocation.id, 99999)) // Non-existing application offering change request id.
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Not able to find an Application Offering Change Request.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it("Should throw forbidden exception when the institution user does not have access to application location.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const applicationOfferingChange =
      await saveFakeApplicationOfferingRequestChange(db);
    // Act/Assert
    await request(app.getHttpServer())
      .get(
        getEndpoint(
          applicationOfferingChange.application.location.id,
          applicationOfferingChange.id,
        ),
      ) // Location id with no access to the institution user.
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message: "Forbidden resource",
        error: "Forbidden",
        statusCode: HttpStatus.FORBIDDEN,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Get the API endpoint.
 * @param locationId location id of the institution.
 * @param applicationOfferingChangeRequestId application offering change request id.
 * @returns the endpoint URL.
 */
function getEndpoint(
  locationId: number,
  applicationOfferingChangeRequestId: number,
): string {
  return `/institutions/location/${locationId}/application-offering-change-request/${applicationOfferingChangeRequestId}`;
}
