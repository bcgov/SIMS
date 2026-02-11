import { HttpStatus, INestApplication } from "@nestjs/common";
import { faker } from "@faker-js/faker";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getInstitutionToken,
  InstitutionTokenTypes,
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeUser,
  getProviderInstanceForModule,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import { INSTITUTION_TYPE_BC_PUBLIC } from "@sims/sims-db/constant";
import { BCeIDService } from "../../../../services";
import { AppInstitutionsModule } from "../../../../app.institutions.module";
import { getInstitutionProfilePayload } from "./institution.utils";
import { User } from "@sims/sims-db";
import { AccountDetails } from "../../../../services/bceid/account-details.model";

describe("InstitutionInstitutionsController(e2e)-getInstitutionDetail", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let appModule: TestingModule;
  let bCeIDService: BCeIDService;
  const endpoint = "/institutions/institution";

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    bCeIDService = await getProviderInstanceForModule(
      appModule,
      AppInstitutionsModule,
      BCeIDService,
    );
  });

  beforeEach(async () => {
    await resetMockJWTUserInfo(appModule);
  });

  it(
    "Should create the institution and the institution user from the user token" +
      " when the institution is associated with the token user and institution is not already set up.",
    async () => {
      // Arrange
      const user = createFakeUser();
      const payload = {
        ...getInstitutionProfilePayload(),
        userEmail: user.email,
      };
      const fakeBCeIDAccount = getFakeBCeIDAccount(user, "Some legal name");
      bCeIDService.getAccountDetails = jest
        .fn()
        .mockReturnValueOnce(fakeBCeIDAccount);
      await mockJWTUserInfo(appModule, user);
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );

      // Act/Assert
      let institutionId: number;
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          expect(response.body.id).toBeGreaterThan(0);
          institutionId = response.body.id;
        });
      const createdInstitution = await db.institution.findOne({
        select: {
          id: true,
          businessGuid: true,
          establishedDate: true,
          institutionAddress: {
            mailingAddress: {
              addressLine1: true,
              addressLine2: true,
              city: true,
              country: true,
              postalCode: true,
              provinceState: true,
              selectedCountry: true,
            },
          },
          institutionPrimaryContact: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
          institutionType: {
            id: true,
          },
          legalOperatingName: true,
          operatingName: true,
          otherRegulatingBody: true,
          primaryEmail: true,
          primaryPhone: true,
          regulatingBody: true,
          website: true,
          country: true,
          province: true,
          classification: true,
          organizationStatus: true,
          medicalSchoolStatus: true,
          creator: { id: true, userName: true },
        },
        where: { id: institutionId },
        relations: { institutionType: true, creator: true },
      });
      expect(createdInstitution).toEqual({
        id: institutionId,
        businessGuid: fakeBCeIDAccount.institution.guid,
        establishedDate: payload.establishedDate,
        institutionAddress: {
          mailingAddress: {
            addressLine1: payload.mailingAddress.addressLine1,
            addressLine2: payload.mailingAddress.addressLine2,
            city: payload.mailingAddress.city,
            country: payload.mailingAddress.country,
            postalCode: payload.mailingAddress.postalCode,
            provinceState: payload.mailingAddress.provinceState,
            selectedCountry: payload.mailingAddress.selectedCountry,
          },
        },
        institutionPrimaryContact: {
          email: payload.primaryContactEmail,
          firstName: payload.primaryContactFirstName,
          lastName: payload.primaryContactLastName,
          phone: payload.primaryContactPhone,
        },
        institutionType: {
          id: INSTITUTION_TYPE_BC_PUBLIC,
        },
        legalOperatingName: fakeBCeIDAccount.institution.legalName,
        operatingName: payload.operatingName,
        otherRegulatingBody: null,
        primaryEmail: payload.primaryEmail,
        primaryPhone: payload.primaryPhone,
        regulatingBody: payload.regulatingBody,
        website: payload.website,
        country: payload.country,
        province: payload.province,
        classification: payload.classification,
        organizationStatus: payload.organizationStatus,
        medicalSchoolStatus: payload.medicalSchoolStatus,
        creator: { id: expect.any(Number), userName: user.userName },
      });
    },
  );

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Generate a fake BCeID account details based on the given user and legal name.
 * @param user user.
 * @param legalName institution legal name.
 * @returns bCeID account details.
 */
function getFakeBCeIDAccount(user: User, legalName: string): AccountDetails {
  return {
    user: { firstname: user.firstName, surname: user.lastName },
    institution: {
      guid: faker.string.uuid(),
      legalName,
    },
  } as AccountDetails;
}
