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
        parentFullName: parentFullName,
        supportingData: null,
        contactInfo: null,
        sin: null,
        birthDate: null,
        personalInfo: {
          givenNames: "TestGivenNames",
          lastName: "TestLastName",
          hasValidSIN: FormYesNoOptions.Yes,
        },
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
