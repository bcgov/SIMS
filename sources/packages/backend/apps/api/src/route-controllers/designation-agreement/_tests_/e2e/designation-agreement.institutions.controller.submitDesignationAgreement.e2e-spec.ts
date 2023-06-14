import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  DesignationAgreementStatus,
  Institution,
  InstitutionLocation,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitutionLocation,
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
import { DryRunSubmissionResult } from "../../../../types";
import { TestingModule } from "@nestjs/testing";
import { AppInstitutionsModule } from "../../../../app.institutions.module";

describe("DesignationAgreementInstitutionsController(e2e)-submitDesignationAgreement", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
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
    collegeFLocation = createFakeInstitutionLocation(collegeF);
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFAdminLegalSigningUser,
      collegeFLocation,
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
    jest.spyOn(formService, "dryRunSubmission").mockImplementation(async () => {
      return { valid: true, data: { data: payload } } as DryRunSubmissionResult;
    });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFAdminLegalSigningUser,
    );
    const endpoint = "/institutions/designation-agreement";

    // Act/Assert
    let designationAgreementId: string;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        designationAgreementId = response.text;
      });
    const designationAgreement = await db.designationAgreement.findOne({
      where: { id: +designationAgreementId },
    });
    expect(designationAgreement.designationStatus).toBe(
      DesignationAgreementStatus.Pending,
    );
  });
});
