import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  DesignationAgreementStatus,
  Institution,
  InstitutionLocation,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeDesignationAgreement,
  createFakeInstitutionLocation,
  createFakeUser,
  getProviderInstanceForModule,
} from "@sims/test-utils";
import {
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  InstitutionTokenTypes,
  getInstitutionToken,
  authorizeUserTokenForLocation,
  getAuthRelatedEntities,
} from "../../../../testHelpers";
import * as request from "supertest";
import { FormService } from "../../../../services";
import { TestingModule } from "@nestjs/testing";
import { AppInstitutionsModule } from "../../../../app.institutions.module";
import { NO_LOCATION_SELECTED_FOR_DESIGNATION } from "../../../../constants/error-code.constants";

describe("DesignationAgreementInstitutionsController(e2e)-submitDesignationAgreement", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeC: Institution;
  let collegeFLocation: InstitutionLocation;
  let collegeCLocation: InstitutionLocation;
  let testingModule: TestingModule;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const { institution } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFAdminLegalSigningUser,
    );
    collegeF = institution;

    const responseC = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeCAdminLegalSigningUser,
    );
    collegeC = responseC.institution;

    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFAdminLegalSigningUser,
      collegeFLocation,
    );

    collegeCLocation = createFakeInstitutionLocation({ institution: collegeC });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeCAdminLegalSigningUser,
      collegeCLocation,
    );
    testingModule = module;
  });

  it("Should request designation for a public institution when institution user is legal signing authority.", async () => {
    // Arrange
    const payload = {
      dynamicData: {
        eligibilityOfficers: [],
        enrolmentOfficers: [],
        scheduleA: false,
        scheduleB: false,
        scheduleD: false,
        legalAuthorityName: "SIMS COLLF",
        legalAuthorityEmailAddress: "test@gov.bc.ca",
        agreementAccepted: false,
      },
      locations: [
        {
          locationId: collegeFLocation.id,
          requestForDesignation: true,
        },
      ],
    };
    const formService = await getProviderInstanceForModule(
      testingModule,
      AppInstitutionsModule,
      FormService,
    );
    formService.dryRunSubmission = jest
      .fn()
      .mockResolvedValue({ valid: true, data: { data: payload } });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFAdminLegalSigningUser,
    );
    const endpoint = "/institutions/designation-agreement";

    // Act/Assert
    let designationAgreementId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        designationAgreementId = response.body.id;
      });
    const designationAgreement = await db.designationAgreement.findOne({
      where: { id: designationAgreementId },
    });
    expect(designationAgreement.designationStatus).toBe(
      DesignationAgreementStatus.Pending,
    );
  });

  it("Should return an unprocessable entity when a new designation is requested and there is already a pending designation agreement.", async () => {
    // Arrange
    const fakeInstitutionUser = await db.user.save(createFakeUser());

    // Create fake designation agreement.
    const fakeDesignationAgreement = createFakeDesignationAgreement({
      fakeInstitution: collegeC,
      fakeInstitutionLocations: [collegeCLocation],
      fakeUser: fakeInstitutionUser,
    });
    fakeDesignationAgreement.designationStatus =
      DesignationAgreementStatus.Pending;
    await db.designationAgreement.save(fakeDesignationAgreement);

    const payload = {
      dynamicData: {
        eligibilityOfficers: [],
        enrolmentOfficers: [],
        scheduleA: false,
        scheduleB: false,
        scheduleD: false,
        legalAuthorityName: "SIMS COLLC",
        legalAuthorityEmailAddress: "test@gov.bc.ca",
        agreementAccepted: false,
      },
      locations: [
        {
          locationId: collegeCLocation.id,
          requestForDesignation: true,
        },
      ],
    };
    const formService = await getProviderInstanceForModule(
      testingModule,
      AppInstitutionsModule,
      FormService,
    );
    formService.dryRunSubmission = jest
      .fn()
      .mockResolvedValue({ valid: true, data: { data: payload } });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCAdminLegalSigningUser,
    );
    const endpoint = "/institutions/designation-agreement";

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it("Should return an unprocessable entity when no location is selected for designation.", async () => {
    // Arrange
    const payload = {
      dynamicData: {
        eligibilityOfficers: [],
        enrolmentOfficers: [],
        scheduleA: false,
        scheduleB: false,
        scheduleD: false,
        legalAuthorityName: "SIMS COLLF",
        legalAuthorityEmailAddress: "test@gov.bc.ca",
        agreementAccepted: false,
      },
      locations: [
        {
          locationId: collegeFLocation.id,
          requestForDesignation: false,
        },
      ],
    };
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFAdminLegalSigningUser,
    );
    const endpoint = "/institutions/designation-agreement";

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "At least one location must be selected for designation.",
        errorType: NO_LOCATION_SELECTED_FOR_DESIGNATION,
      });
  });

  it("Should return an unprocessable entity when all locations have requestForDesignation set to false.", async () => {
    // Arrange
    const payload = {
      dynamicData: {
        eligibilityOfficers: [],
        enrolmentOfficers: [],
        scheduleA: false,
        scheduleB: false,
        scheduleD: false,
        legalAuthorityName: "SIMS COLLF",
        legalAuthorityEmailAddress: "test@gov.bc.ca",
        agreementAccepted: false,
      },
      locations: [
        {
          locationId: collegeFLocation.id,
          requestForDesignation: false,
        },
        {
          locationId: collegeFLocation.id,
          requestForDesignation: false,
        },
      ],
    };
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFAdminLegalSigningUser,
    );
    const endpoint = "/institutions/designation-agreement";

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "At least one location must be selected for designation.",
        errorType: NO_LOCATION_SELECTED_FOR_DESIGNATION,
      });
  });

  it("Should return forbidden when user attempts to submit designation for an unauthorized location.", async () => {
    // Arrange
    const payload = {
      dynamicData: {
        eligibilityOfficers: [],
        enrolmentOfficers: [],
        scheduleA: false,
        scheduleB: false,
        scheduleD: false,
        legalAuthorityName: "SIMS COLLF",
        legalAuthorityEmailAddress: "test@gov.bc.ca",
        agreementAccepted: false,
      },
      locations: [
        {
          // Using College C location with College F user token.
          locationId: collegeCLocation.id,
          requestForDesignation: true,
        },
      ],
    };
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFAdminLegalSigningUser,
    );
    const endpoint = "/institutions/designation-agreement";

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "One or more locations provided do not belong to designation institution.",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
