import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { faker } from "@faker-js/faker";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeSupportingUser,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  DynamicFormConfiguration,
  DynamicFormType,
  FormYesNoOptions,
  SupportingUserType,
} from "@sims/sims-db";

describe("SupportingUserAESTController(e2e)-getIdentifiableSupportingUser", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let recentPYParentForm: DynamicFormConfiguration;
  let recentPYPartnerForm: DynamicFormConfiguration;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    recentPYParentForm = await db.dynamicFormConfiguration.findOne({
      select: {
        id: true,
        programYear: { id: true, startDate: true },
        formDefinitionName: true,
      },
      relations: { programYear: true },
      where: {
        formType: DynamicFormType.SupportingUsersParent,
        programYear: { active: true },
      },
      order: { programYear: { startDate: "DESC" } },
    });
    recentPYPartnerForm = await db.dynamicFormConfiguration.findOne({
      select: {
        id: true,
        programYear: { id: true, startDate: true },
        formDefinitionName: true,
      },
      relations: { programYear: true },
      where: {
        formType: DynamicFormType.SupportingUsersPartner,
        programYear: { active: true },
      },
      order: { programYear: { startDate: "DESC" } },
    });
  });

  it("Should get supporting user data when the supporting user is a parent with personal information.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, {
      programYear: recentPYParentForm.programYear,
    });

    const parentFullName = faker.string.alpha({ length: 50 });
    const parent = createFakeSupportingUser(
      { application },
      {
        initialValues: {
          isAbleToReport: false,
          supportingUserType: SupportingUserType.Parent,
          fullName: parentFullName,
          personalInfo: {
            givenNames: "TestGivenNames",
            lastName: "TestLastName",
            hasValidSIN: FormYesNoOptions.Yes,
          },
        },
      },
    );
    await db.supportingUser.save(parent);

    const endpoint = `/aest/supporting-user/${parent.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        formName: recentPYParentForm.formDefinitionName,
        isAbleToReport: false,
        programYearStartDate: recentPYParentForm.programYear.startDate,
        fullName: parentFullName,
        supportingData: null,
        contactInfo: null,
        sin: null,
        birthDate: null,
        supportingUserType: SupportingUserType.Parent,
        personalInfo: {
          givenNames: "TestGivenNames",
          lastName: "TestLastName",
          hasValidSIN: FormYesNoOptions.Yes,
        },
      });
  });

  it("Should get supporting user data when the supporting user is a partner with personal information.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, {
      programYear: recentPYParentForm.programYear,
    });

    const partnerFullName = faker.string.alpha({ length: 50 });
    const partner = createFakeSupportingUser(
      { application },
      {
        initialValues: {
          isAbleToReport: false,
          supportingUserType: SupportingUserType.Partner,
          fullName: partnerFullName,
          supportingData: {
            totalIncome: 600000,
            iAgreeToTheAboveCRAConsent: true,
            iAgreeToAboveStudentAidBCConsent: true,
          },
          contactInfo: {
            phone: "6045551234",
            address: {
              city: "Vancouver",
              country: "Canada",
              postalCode: "V1V1V1",
              addressLine1: "123 Main St",
              addressLine2: "Suite 100",
              provinceState: "BC",
            },
          },
          sin: "900000000",
          birthDate: "1990-01-01",
          personalInfo: {
            givenNames: "TestGivenNames",
            lastName: "TestLastName",
            hasValidSIN: FormYesNoOptions.Yes,
          },
        },
      },
    );
    await db.supportingUser.save(partner);

    const endpoint = `/aest/supporting-user/${partner.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        formName: recentPYPartnerForm.formDefinitionName,
        isAbleToReport: false,
        programYearStartDate: recentPYPartnerForm.programYear.startDate,
        fullName: partnerFullName,
        supportingData: {
          totalIncome: 600000,
          iAgreeToTheAboveCRAConsent: true,
          iAgreeToAboveStudentAidBCConsent: true,
        },
        contactInfo: {
          phone: "6045551234",
          address: {
            city: "Vancouver",
            country: "Canada",
            postalCode: "V1V1V1",
            addressLine1: "123 Main St",
            addressLine2: "Suite 100",
            provinceState: "BC",
          },
        },
        sin: "900000000",
        birthDate: "1990-01-01",
        supportingUserType: SupportingUserType.Partner,
        personalInfo: {
          givenNames: "TestGivenNames",
          lastName: "TestLastName",
          hasValidSIN: FormYesNoOptions.Yes,
        },
      });
  });

  it("Should throw not found error when the supporting user id is invalid.", async () => {
    // Arrange
    const supportingUserId = 99999;
    const endpoint = `/aest/supporting-user/${supportingUserId}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Supporting user ${supportingUserId} details not found or Supporting user has not submitted the form`,
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
