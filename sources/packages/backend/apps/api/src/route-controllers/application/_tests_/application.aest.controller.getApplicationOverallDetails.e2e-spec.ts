import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../testHelpers";
import {
  createE2EDataSources,
  createFakeSupportingUser,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  Application,
  ApplicationEditStatus,
  ApplicationStatus,
  SupportingUserType,
} from "@sims/sims-db";
import { addDays } from "@sims/utilities";

describe("ApplicationAESTController(e2e)-getApplicationOverallDetails", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should get all application versions in overall details when there is one or more edited application associated with the given application.", async () => {
    // Arrange
    // Create the parent application and also the first application version.
    const firstVersionApplication = await saveFakeApplication(
      db.dataSource,
      undefined,
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
      },
      {
        applicationNumber: firstVersionApplication.applicationNumber,
        offeringIntensity:
          firstVersionApplication.currentAssessment.offering.offeringIntensity,
        submittedDate: new Date(),
      },
    );
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/application/${currentApplication.id}/overall-details`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        currentApplication: {
          id: currentApplication.id,
          submittedDate: currentApplication.submittedDate.toISOString(),
          applicationEditStatus: currentApplication.applicationEditStatus,
          supportingUsers: [],
        },
        previousVersions: [
          {
            id: secondVersionApplication.id,
            submittedDate: secondVersionApplication.submittedDate.toISOString(),
            applicationEditStatus:
              secondVersionApplication.applicationEditStatus,
            supportingUsers: [],
          },
          {
            id: firstVersionApplication.id,
            submittedDate: firstVersionApplication.submittedDate.toISOString(),
            applicationEditStatus:
              firstVersionApplication.applicationEditStatus,
            supportingUsers: [],
          },
        ],
      });
  });

  it("Should get the original application and no application versions in overall details when there is no edited application associated with the given application.", async () => {
    // Arrange
    // Create the parent application and also the first application version.
    const originalApplication = await saveFakeApplication(db.dataSource);

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/application/${originalApplication.id}/overall-details`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
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
    "Should get the current application and an in-progress change request, including supporting users" +
      " when the application has an in-progress change request.",
    async () => {
      // Arrange
      // Create the current application.
      const currentApplication = await saveFakeApplication(
        db.dataSource,
        undefined,
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

      const token = await getAESTToken(AESTGroups.BusinessAdministrators);
      const endpoint = `/aest/application/${currentApplication.id}/overall-details`;

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          currentApplication: {
            id: currentApplication.id,
            submittedDate: currentApplication.submittedDate.toISOString(),
            applicationEditStatus: currentApplication.applicationEditStatus,
            supportingUsers: [],
          },
          inProgressChangeRequest: {
            id: changeRequestApplication.id,
            submittedDate: changeRequestApplication.submittedDate.toISOString(),
            applicationEditStatus:
              changeRequestApplication.applicationEditStatus,
            supportingUsers: [
              {
                supportingUserId: partner.id,
                supportingUserType: partner.supportingUserType,
              },
            ],
          },
          previousVersions: [],
        });
    },
  );

  it("Should get the current application and an application version when the application has a declined change request.", async () => {
    // Arrange
    // Create the current application.
    const currentApplication = await saveFakeApplication(
      db.dataSource,
      undefined,
      {
        applicationStatus: ApplicationStatus.Completed,
        submittedDate: addDays(-1),
      },
    );
    // Create the declined change request.
    const changeRequestApplication = await saveFakeApplication(
      db.dataSource,
      {
        parentApplication: { id: currentApplication.id } as Application,
        precedingApplication: {
          id: currentApplication.id,
        } as Application,
      },
      {
        submittedDate: new Date(),
        applicationStatus: ApplicationStatus.Edited,
        applicationEditStatus: ApplicationEditStatus.ChangeDeclined,
      },
    );

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/application/${currentApplication.id}/overall-details`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        currentApplication: {
          id: currentApplication.id,
          submittedDate: currentApplication.submittedDate.toISOString(),
          applicationEditStatus: currentApplication.applicationEditStatus,
          supportingUsers: [],
        },
        previousVersions: [
          {
            id: changeRequestApplication.id,
            submittedDate: changeRequestApplication.submittedDate.toISOString(),
            applicationEditStatus:
              changeRequestApplication.applicationEditStatus,
            supportingUsers: [],
          },
        ],
      });
  });

  it("Should get the current application and versions supporting users when the application and its versions have supporting users.", async () => {
    // Arrange
    // Create the parent application and also the first application version.
    const firstVersionApplication = await saveFakeApplication(
      db.dataSource,
      undefined,
      {
        applicationStatus: ApplicationStatus.Edited,
        submittedDate: addDays(-1),
      },
    );
    // Create the current application.
    const currentApplication = await saveFakeApplication(
      db.dataSource,
      {
        parentApplication: { id: firstVersionApplication.id } as Application,
        precedingApplication: {
          id: firstVersionApplication.id,
        } as Application,
      },
      {
        applicationNumber: firstVersionApplication.applicationNumber,
        offeringIntensity:
          firstVersionApplication.currentAssessment.offering.offeringIntensity,
        submittedDate: new Date(),
      },
    );
    // Create parents supporting users for the current application.
    const parent1 = createFakeSupportingUser(
      { application: currentApplication },
      {
        initialValues: {
          supportingUserType: SupportingUserType.Parent,
        },
      },
    );
    const parent2 = createFakeSupportingUser(
      { application: currentApplication },
      {
        initialValues: {
          supportingUserType: SupportingUserType.Parent,
        },
      },
    );
    // Create partner supporting user for first version of the application.
    const partner = createFakeSupportingUser(
      { application: firstVersionApplication },
      {
        initialValues: {
          supportingUserType: SupportingUserType.Partner,
        },
      },
    );
    await db.supportingUser.save([parent1, parent2, partner]);

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/application/${currentApplication.id}/overall-details`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        currentApplication: {
          id: currentApplication.id,
          submittedDate: currentApplication.submittedDate.toISOString(),
          applicationEditStatus: currentApplication.applicationEditStatus,
          supportingUsers: [
            {
              supportingUserId: parent1.id,
              supportingUserType: parent1.supportingUserType,
            },
            {
              supportingUserId: parent2.id,
              supportingUserType: parent2.supportingUserType,
            },
          ],
        },
        previousVersions: [
          {
            id: firstVersionApplication.id,
            submittedDate: firstVersionApplication.submittedDate.toISOString(),
            applicationEditStatus:
              firstVersionApplication.applicationEditStatus,
            supportingUsers: [
              {
                supportingUserId: partner.id,
                supportingUserType: partner.supportingUserType,
              },
            ],
          },
        ],
      });
  });

  it("Should throw not found error when an application is not found.", async () => {
    // Arrange
    const endpoint = "/aest/application/99999999/overall-details";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
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
