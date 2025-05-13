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
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  Application,
  ApplicationData,
  ApplicationStatus,
  EducationProgramOffering,
  OfferingIntensity,
} from "@sims/sims-db";
import { getUserFullName } from "../../../utilities";
import { addDays, getISODateOnlyString } from "@sims/utilities";

describe("ApplicationAESTController(e2e)-getApplicationDetails", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should get the student application details when the optional query parameter to load dynamic data is not passed.", async () => {
    // Arrange
    const offeringInitialValues = {
      studyStartDate: getISODateOnlyString(addDays(-10)),
      studyEndDate: getISODateOnlyString(addDays(10)),
      offeringIntensity: OfferingIntensity.fullTime,
    } as EducationProgramOffering;

    const application = await saveFakeApplication(
      db.dataSource,
      {},
      {
        offeringInitialValues: offeringInitialValues,
        offeringIntensity: OfferingIntensity.fullTime,
      },
    );

    await db.application.save(application);

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    const endpoint = `/aest/application/${application.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        data: {},
        id: application.id,
        applicationStatus: application.applicationStatus,
        applicationEditStatus: application.applicationEditStatus,
        applicationNumber: application.applicationNumber,
        isArchived: false,
        applicationFormName: "SFAA2022-23",
        applicationProgramYearID: application.programYear.id,
        studentFullName: getUserFullName(application.student.user),
        applicationOfferingIntensity: offeringInitialValues.offeringIntensity,
        applicationStartDate: offeringInitialValues.studyStartDate,
        applicationEndDate: offeringInitialValues.studyEndDate,
        applicationInstitutionName:
          application.location.institution.legalOperatingName,
        isChangeRequestAllowedForPY: false,
      });
  });

  it("Should get the student application details without dynamic data when the optional query parameter to load dynamic data is set to false.", async () => {
    // Arrange
    const offeringInitialValues = {
      studyStartDate: getISODateOnlyString(addDays(-10)),
      studyEndDate: getISODateOnlyString(addDays(10)),
      offeringIntensity: OfferingIntensity.fullTime,
    } as EducationProgramOffering;

    const application = await saveFakeApplication(
      db.dataSource,
      {},
      {
        offeringInitialValues: offeringInitialValues,
        offeringIntensity: OfferingIntensity.fullTime,
      },
    );

    await db.application.save(application);

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    const endpoint = `/aest/application/${application.id}?loadDynamicData=false`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        id: application.id,
        applicationStatus: application.applicationStatus,
        applicationEditStatus: application.applicationEditStatus,
        applicationNumber: application.applicationNumber,
        isArchived: false,
        applicationFormName: "SFAA2022-23",
        applicationProgramYearID: application.programYear.id,
        studentFullName: getUserFullName(application.student.user),
        applicationOfferingIntensity: offeringInitialValues.offeringIntensity,
        applicationStartDate: offeringInitialValues.studyStartDate,
        applicationEndDate: offeringInitialValues.studyEndDate,
        applicationInstitutionName:
          application.location.institution.legalOperatingName,
        isChangeRequestAllowedForPY: false,
      });
  });

  it(
    "Should get the student application details when the application status is edited and " +
      "the optional query parameter to load dynamic data is not passed.",
    async () => {
      // Arrange
      const applicationOfferingIntensity = OfferingIntensity.fullTime;
      const application = await saveFakeApplication(db.dataSource, undefined, {
        applicationStatus: ApplicationStatus.Edited,
        offeringIntensity: applicationOfferingIntensity,
      });

      await db.application.save(application);

      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      const endpoint = `/aest/application/${application.id}`;

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          data: {},
          id: application.id,
          applicationStatus: application.applicationStatus,
          applicationEditStatus: application.applicationEditStatus,
          applicationNumber: application.applicationNumber,
          isArchived: false,
          applicationFormName: "SFAA2022-23",
          applicationProgramYearID: application.programYear.id,
          studentFullName: getUserFullName(application.student.user),
          applicationOfferingIntensity: applicationOfferingIntensity,
          applicationStartDate:
            application.currentAssessment.offering.studyStartDate,
          applicationEndDate:
            application.currentAssessment.offering.studyEndDate,
          applicationInstitutionName:
            application.location.institution.legalOperatingName,
          isChangeRequestAllowedForPY: false,
        });
    },
  );

  it("Should get the student application changes when the application has a previous version and its dynamic data was changed.", async () => {
    // Arrange
    const previousApplication = await saveFakeApplication(
      db.dataSource,
      {},
      {
        applicationStatus: ApplicationStatus.Edited,
        applicationData: {
          studystartDate: "2000-01-01",
          studyendDate: "2000-01-31",
          selectedOffering: 1,
          studentNumber: "1234567",
          courseDetails: [
            {
              courseName: "courseName",
              courseCode: "courseCode",
            },
          ],
        } as ApplicationData,
      },
    );
    const currentApplication = await saveFakeApplication(
      db.dataSource,
      {
        parentApplication: { id: previousApplication.id } as Application,
        precedingApplication: { id: previousApplication.id } as Application,
      },
      {
        applicationStatus: ApplicationStatus.Completed,
        applicationNumber: previousApplication.applicationNumber,
        applicationData: {
          studystartDate: "2000-12-01",
          studyendDate: "2000-12-31",
          selectedOffering: 4,
          courseDetails: [
            {
              courseName: "courseName updated",
              courseCode: "courseCode",
            },
          ],
        } as ApplicationData,
      },
    );
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/application/${currentApplication.id}`;

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    expect(response.body.changes).toStrictEqual([
      {
        changeType: "updated",
        key: "studyendDate",
      },
      {
        changeType: "updated",
        changes: [
          {
            changeType: "updated",
            changes: [
              {
                changeType: "updated",
                key: "courseName",
              },
            ],
            index: 0,
          },
        ],
        key: "courseDetails",
      },
      {
        changeType: "updated",
        key: "studystartDate",
      },
      {
        changeType: "updated",
        key: "selectedOffering",
      },
      {
        changeType: "updated",
        key: "selectedOfferingName",
      },
    ]);
  });

  it("Should get the latest student application details when the optional query parameter isParentApplication is set to true.", async () => {
    // Arrange
    const offeringInitialValues = {
      studyStartDate: getISODateOnlyString(addDays(-10)),
      studyEndDate: getISODateOnlyString(addDays(10)),
      offeringIntensity: OfferingIntensity.fullTime,
    } as EducationProgramOffering;

    const firstApplication = await saveFakeApplication(
      db.dataSource,
      {},
      {
        applicationStatus: ApplicationStatus.Edited,
        offeringInitialValues: offeringInitialValues,
        offeringIntensity: OfferingIntensity.fullTime,
      },
    );
    firstApplication.parentApplication = {
      id: firstApplication.id,
    } as Application;
    firstApplication.precedingApplication = firstApplication.parentApplication;
    const savedFirstApplication = await db.application.save(firstApplication);

    const secondApplication = await saveFakeApplication(
      db.dataSource,
      {
        student: firstApplication.student,
        institutionLocation: firstApplication.location,
        precedingApplication: { id: savedFirstApplication.id } as Application,
        parentApplication: { id: savedFirstApplication.id } as Application,
      },
      {
        applicationStatus: ApplicationStatus.Edited,
        applicationNumber: savedFirstApplication.applicationNumber,
        offeringInitialValues: offeringInitialValues,
        offeringIntensity: OfferingIntensity.fullTime,
      },
    );

    const thirdApplication = await saveFakeApplication(
      db.dataSource,
      {
        student: firstApplication.student,
        institutionLocation: firstApplication.location,
        precedingApplication: { id: secondApplication.id } as Application,
        parentApplication: {
          id: savedFirstApplication.parentApplication.id,
        } as Application,
      },
      {
        applicationStatus: ApplicationStatus.InProgress,
        applicationNumber: savedFirstApplication.applicationNumber,
        offeringInitialValues: offeringInitialValues,
        offeringIntensity: OfferingIntensity.fullTime,
      },
    );

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    const endpoint = `/aest/application/${firstApplication.id}?isParentApplication=true`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        data: {},
        id: thirdApplication.id,
        applicationStatus: thirdApplication.applicationStatus,
        applicationEditStatus: thirdApplication.applicationEditStatus,
        applicationNumber: thirdApplication.applicationNumber,
        isArchived: false,
        applicationFormName: "SFAA2022-23",
        applicationProgramYearID: thirdApplication.programYear.id,
        studentFullName: getUserFullName(thirdApplication.student.user),
        applicationOfferingIntensity: offeringInitialValues.offeringIntensity,
        applicationStartDate: offeringInitialValues.studyStartDate,
        applicationEndDate: offeringInitialValues.studyEndDate,
        applicationInstitutionName:
          thirdApplication.location.institution.legalOperatingName,
        isChangeRequestAllowedForPY: false,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
