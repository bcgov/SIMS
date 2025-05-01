import { HttpStatus, INestApplication } from "@nestjs/common";
import { DynamicFormType, OfferingIntensity, ProgramYear } from "@sims/sims-db";
import {
  createE2EDataSources,
  E2EDataSources,
  ensureProgramYearExists,
} from "@sims/test-utils";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getStudentToken,
  FakeStudentUsersTypes,
  createPYStudentApplicationFormConfiguration,
} from "../../../../testHelpers";
import { DynamicFormConfigurationService } from "../../../../services";

describe("DynamicFormConfigurationController(e2e)-getDynamicFormConfiguration", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let activeProgramYear: ProgramYear;
  let inactiveProgramYear: ProgramYear;
  let fullTimeFormName: string;
  let partTimeFormName: string;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    app = nestApplication;
    const dynamicFormConfigurationService = app.get(
      DynamicFormConfigurationService,
    );
    // Create fake active and inactive program years.
    const activeProgramYearPromise = ensureProgramYearExists(db, 2070);
    const inactiveProgramYearPromise = ensureProgramYearExists(db, 2069);
    [activeProgramYear, inactiveProgramYear] = await Promise.all([
      activeProgramYearPromise,
      inactiveProgramYearPromise,
    ]);
    inactiveProgramYear.active = false;
    await db.programYear.save(inactiveProgramYear);
    // Ensure the dynamic form configuration is created for the active program year.
    const { fullTimeConfiguration, partTimeConfiguration } =
      await createPYStudentApplicationFormConfiguration(
        db,
        activeProgramYear,
        dynamicFormConfigurationService,
      );
    fullTimeFormName = fullTimeConfiguration.formDefinitionName;
    partTimeFormName = partTimeConfiguration.formDefinitionName;
  });

  it("Should get the dynamic form configuration for the student application when the program year is active and the offering intensity is part-time.", async () => {
    // Arrange
    const endpoint = `/dynamic-form-configuration/form-type/${DynamicFormType.StudentFinancialAidApplication}?programYearId=${activeProgramYear.id}&offeringIntensity=${OfferingIntensity.partTime}`;
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({ formDefinitionName: partTimeFormName });
  });

  it("Should get the dynamic form configuration for the student application when the program year is active and the offering intensity is full-time.", async () => {
    // Arrange
    const endpoint = `/dynamic-form-configuration/form-type/${DynamicFormType.StudentFinancialAidApplication}?programYearId=${activeProgramYear.id}&offeringIntensity=${OfferingIntensity.fullTime}`;
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({ formDefinitionName: fullTimeFormName });
  });

  it("Should throw unprocessable entity exception when the program year provided is not active and the offering intensity is full-time.", async () => {
    // Arrange
    const endpoint = `/dynamic-form-configuration/form-type/${DynamicFormType.StudentFinancialAidApplication}?programYearId=${inactiveProgramYear.id}&offeringIntensity=${OfferingIntensity.fullTime}`;
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "Program year not found or is not active.",
        error: "Unprocessable Entity",
        statusCode: 422,
      });
  });

  afterAll(async () => {
    app?.close();
  });
});
