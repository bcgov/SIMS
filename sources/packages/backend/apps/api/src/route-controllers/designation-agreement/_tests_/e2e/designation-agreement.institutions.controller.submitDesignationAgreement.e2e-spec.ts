import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  DesignationAgreementStatus,
  Institution,
  InstitutionLocation,
  User,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitutionLocation,
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

describe("EducationProgramOfferingInstitutionsController(e2e)-createOffering", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let collegeFUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const { institution, user: institutionUser } = await getAuthRelatedEntities(
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
    collegeFUser = institutionUser;
  });

  it("Should request designation for a public institution when institution user is legal signing authority.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFAdminLegalSigningUser,
    );
    const endpoint = "/institutions/designation-agreement";
    const payload = {
      dynamicData: {
        eligibilityOfficers: [
          {
            name: "",
            positionTitle: "",
            email: "",
            phone: "",
          },
        ],
        enrolmentOfficers: [
          {
            name: "",
            positionTitle: "",
            email: "",
            phone: "",
          },
        ],
        textArea:
          "WHEREAS:\n\nA The Ministry of Post Secondary and Future Skills (“the Ministry”) is responsible for ...",
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

    // Act
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect({});

    // Assert
    const designationAgreement = await db.designationAgreement.findOne({
      relations: { creator: true },
      where: {
        institution: { id: collegeF.id },
        designationStatus: DesignationAgreementStatus.Pending,
      },
    });
    expect(designationAgreement.creator.id).toBe(collegeFUser.id);
  });
});
