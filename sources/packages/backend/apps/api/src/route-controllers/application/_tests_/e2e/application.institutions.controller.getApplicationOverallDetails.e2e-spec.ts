import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../testHelpers";
import {
  createE2EDataSources,
  createFakeInstitutionLocation,
  createFakeSupportingUser,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  Application,
  ApplicationEditStatus,
  ApplicationStatus,
  InstitutionLocation,
  SupportingUserType,
} from "@sims/sims-db";
import { addDays } from "@sims/utilities";

describe("ApplicationInstitutionsController(e2e)-getApplicationOverallDetails", () => {
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

  it("Should get only the current application and no applications versions in overall details when there is one or more edited application associated with the given application.", async () => {
    // Arrange
    // Create the parent application and also the first application version.
    const firstVersionApplication = await saveFakeApplication(
      db.dataSource,
      { institutionLocation: collegeFLocation },
      {
        applicationStatus: ApplicationStatus.Edited,
        submittedDate: addDays(-2),
      },
    );

    const secondVersionApplication = await saveFakeApplication(
      db.dataSource,
      {
        parentApplication: { id: firstVersionApplication.id } as Application,
        precedingApplication: { id: firstVersionApplication.id } as Application,
        institutionLocation: collegeFLocation,
      },
      {
        applicationStatus: ApplicationStatus.Edited,
        applicationNumber: firstVersionApplication.applicationNumber,
        offeringIntensity:
          firstVersionApplication.currentAssessment.offering.offeringIntensity,
        submittedDate: addDays(-1),
      },
    );

    const currentApplication = await saveFakeApplication(
      db.dataSource,
      {
        parentApplication: { id: firstVersionApplication.id } as Application,
        precedingApplication: {
          id: secondVersionApplication.id,
        } as Application,
        institutionLocation: collegeFLocation,
      },
      {
        applicationNumber: firstVersionApplication.applicationNumber,
        offeringIntensity:
          firstVersionApplication.currentAssessment.offering.offeringIntensity,
        submittedDate: new Date(),
      },
    );
    const endpoint = `/institutions/application/student/${currentApplication.student.id}/application/${currentApplication.id}/overall-details`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        currentApplication: {
          id: currentApplication.id,
          submittedDate: currentApplication.submittedDate.toISOString(),
          applicationEditStatus: currentApplication.applicationEditStatus,
          supportingUsers: [],
        },
        previousVersions: [],
      });
  });

  it("Should get the original application and no application versions in overall details when there is no edited application associated with the given application.", async () => {
    // Arrange
    // Create the parent application and also the first application version.
    const originalApplication = await saveFakeApplication(db.dataSource, {
      institutionLocation: collegeFLocation,
    });

    const endpoint = `/institutions/application/student/${originalApplication.student.id}/application/${originalApplication.id}/overall-details`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        currentApplication: {
          id: originalApplication.id,
          submittedDate: originalApplication.submittedDate.toISOString(),
          applicationEditStatus: originalApplication.applicationEditStatus,
          supportingUsers: [],
        },
        previousVersions: [],
      });
  });

  it(
    "Should get the current application and no in-progress change request" +
      " when the application has an in-progress change request.",
    async () => {
      // Arrange
      // Create the current application.
      const currentApplication = await saveFakeApplication(
        db.dataSource,
        { institutionLocation: collegeFLocation },
        {
          applicationStatus: ApplicationStatus.Completed,
          submittedDate: addDays(-1),
        },
      );
      // Create the in-progress change request.
      const changeRequestApplication = await saveFakeApplication(
        db.dataSource,
        {
          parentApplication: { id: currentApplication.id } as Application,
          precedingApplication: {
            id: currentApplication.id,
          } as Application,
          institutionLocation: collegeFLocation,
        },
        {
          submittedDate: new Date(),
          applicationStatus: ApplicationStatus.Edited,
          applicationEditStatus: ApplicationEditStatus.ChangeInProgress,
        },
      );
      // Create partner supporting user for the change request application.
      const partner = createFakeSupportingUser(
        { application: changeRequestApplication },
        {
          initialValues: {
            supportingUserType: SupportingUserType.Partner,
          },
        },
      );
      await db.supportingUser.save(partner);

      const endpoint = `/institutions/application/student/${currentApplication.student.id}/application/${currentApplication.id}/overall-details`;
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          currentApplication: {
            id: currentApplication.id,
            submittedDate: currentApplication.submittedDate.toISOString(),
            applicationEditStatus: currentApplication.applicationEditStatus,
            supportingUsers: [],
          },
          previousVersions: [],
        });
    },
  );

  afterAll(async () => {
    await app?.close();
  });
});
