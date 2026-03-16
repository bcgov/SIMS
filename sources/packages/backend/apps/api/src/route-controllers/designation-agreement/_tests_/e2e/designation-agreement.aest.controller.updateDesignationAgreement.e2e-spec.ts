import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DesignationAgreementStatus } from "@sims/sims-db";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  InstitutionTokenTypes,
  createTestingAppModule,
  getAESTToken,
  getAuthRelatedEntities,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeDesignationAgreement,
  createFakeInstitutionLocation,
  createFakeUser,
} from "@sims/test-utils";
import { MISSING_INSTITUTION_LOCATION_CODE } from "../../../../constants";

describe("DesignationAgreementAESTController(e2e)-updateDesignationAgreement", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should approve a designation agreement when all payload locations belong to the institution.", async () => {
    // Arrange
    const { institution } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFAdminLegalSigningUser,
    );
    const fakeLocation = createFakeInstitutionLocation({ institution });
    const savedLocation = await db.institutionLocation.save(fakeLocation);
    const fakeUser = await db.user.save(createFakeUser());
    const fakeDesignation = createFakeDesignationAgreement({
      fakeInstitution: institution,
      fakeInstitutionLocations: [savedLocation],
      fakeUser,
    });
    fakeDesignation.designationStatus = DesignationAgreementStatus.Pending;
    const savedDesignation =
      await db.designationAgreement.save(fakeDesignation);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/designation-agreement/${savedDesignation.id}`;

    // Act
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .send({
        designationStatus: DesignationAgreementStatus.Approved,
        startDate: "2026-01-01",
        endDate: "2027-12-31",
        locationsDesignations: [
          { locationId: savedLocation.id, approved: true },
        ],
        note: "Designation approved.",
      })
      .expect(HttpStatus.OK);

    // Assert
    const updatedDesignation = await db.designationAgreement.findOneBy({
      id: savedDesignation.id,
    });
    expect(updatedDesignation.designationStatus).toBe(
      DesignationAgreementStatus.Approved,
    );
  });

  it("Should decline a designation agreement.", async () => {
    // Arrange
    const { institution } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFAdminLegalSigningUser,
    );
    const fakeLocation = createFakeInstitutionLocation({ institution });
    const savedLocation = await db.institutionLocation.save(fakeLocation);
    const fakeUser = await db.user.save(createFakeUser());
    const fakeDesignation = createFakeDesignationAgreement({
      fakeInstitution: institution,
      fakeInstitutionLocations: [savedLocation],
      fakeUser,
    });
    fakeDesignation.designationStatus = DesignationAgreementStatus.Pending;
    const savedDesignation =
      await db.designationAgreement.save(fakeDesignation);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/designation-agreement/${savedDesignation.id}`;

    // Act
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .send({
        designationStatus: DesignationAgreementStatus.Declined,
        note: "Designation declined.",
      })
      .expect(HttpStatus.OK);

    // Assert
    const updatedDesignation = await db.designationAgreement.findOneBy({
      id: savedDesignation.id,
    });
    expect(updatedDesignation.designationStatus).toBe(
      DesignationAgreementStatus.Declined,
    );
  });

  it("Should return not found when the designation agreement does not exist.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/designation-agreement/99999999`;

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .send({
        designationStatus: DesignationAgreementStatus.Declined,
        note: "Some note.",
      })
      .expect(HttpStatus.NOT_FOUND);
  });

  it("Should return unprocessable entity when approved location does not belong to the designation institution.", async () => {
    // Arrange
    const { institution } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFAdminLegalSigningUser,
    );
    const fakeLocation = createFakeInstitutionLocation({ institution });
    const savedLocation = await db.institutionLocation.save(fakeLocation);
    const fakeUser = await db.user.save(createFakeUser());
    const fakeDesignation = createFakeDesignationAgreement({
      fakeInstitution: institution,
      fakeInstitutionLocations: [savedLocation],
      fakeUser,
    });
    fakeDesignation.designationStatus = DesignationAgreementStatus.Pending;
    const savedDesignation =
      await db.designationAgreement.save(fakeDesignation);
    // Create a location that belongs to a different institution.
    const unrelatedLocation = createFakeInstitutionLocation();
    const savedUnrelatedLocation =
      await db.institutionLocation.save(unrelatedLocation);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/designation-agreement/${savedDesignation.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .send({
        designationStatus: DesignationAgreementStatus.Approved,
        startDate: "2026-01-01",
        endDate: "2027-12-31",
        locationsDesignations: [
          { locationId: savedUnrelatedLocation.id, approved: true },
        ],
        note: "Attempt with unrelated location.",
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it("Should return unprocessable entity when an approved location is missing an institution location code.", async () => {
    // Arrange
    const { institution } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFAdminLegalSigningUser,
    );
    // Create a location without an institution code to simulate locations
    // submitted with the "I do not have an institution location code" option selected.
    const fakeLocation = createFakeInstitutionLocation({ institution });
    fakeLocation.institutionCode = null;
    const savedLocation = await db.institutionLocation.save(fakeLocation);
    const fakeUser = await db.user.save(createFakeUser());
    const fakeDesignation = createFakeDesignationAgreement({
      fakeInstitution: institution,
      fakeInstitutionLocations: [savedLocation],
      fakeUser,
    });
    fakeDesignation.designationStatus = DesignationAgreementStatus.Pending;
    const savedDesignation =
      await db.designationAgreement.save(fakeDesignation);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/designation-agreement/${savedDesignation.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .send({
        designationStatus: DesignationAgreementStatus.Approved,
        startDate: "2026-01-01",
        endDate: "2027-12-31",
        locationsDesignations: [
          { locationId: savedLocation.id, approved: true },
        ],
        note: "Attempt to approve location without code.",
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "One or more approved locations are missing an institution location code.",
        errorType: MISSING_INSTITUTION_LOCATION_CODE,
      });
  });
});
