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
import { EducationProgramOffering, OfferingIntensity } from "@sims/sims-db";
import { getUserFullName } from "../../../utilities";
import {
  addDays,
  getDateOnlyFormat,
  getISODateOnlyString,
} from "@sims/utilities";

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
        applicationNumber: application.applicationNumber,
        applicationFormName: "SFAA2022-23",
        applicationProgramYearID: application.programYearId,
        studentFullName: getUserFullName(application.student.user),
        applicationOfferingIntensity: offeringInitialValues.offeringIntensity,
        applicationStartDate: getDateOnlyFormat(
          offeringInitialValues.studyStartDate,
        ),
        applicationEndDate: getDateOnlyFormat(
          offeringInitialValues.studyEndDate,
        ),
        applicationInstitutionName:
          application.location.institution.legalOperatingName,
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
        applicationNumber: application.applicationNumber,
        applicationFormName: "SFAA2022-23",
        applicationProgramYearID: application.programYearId,
        studentFullName: getUserFullName(application.student.user),
        applicationOfferingIntensity: offeringInitialValues.offeringIntensity,
        applicationStartDate: getDateOnlyFormat(
          offeringInitialValues.studyStartDate,
        ),
        applicationEndDate: getDateOnlyFormat(
          offeringInitialValues.studyEndDate,
        ),
        applicationInstitutionName:
          application.location.institution.legalOperatingName,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
