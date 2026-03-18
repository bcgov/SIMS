import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DesignationAgreementStatus, NoteType, User } from "@sims/sims-db";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeDesignationAgreement,
  createFakeInstitution,
  createFakeInstitutionLocation,
  createFakeUser,
} from "@sims/test-utils";

describe("DesignationAgreementAESTController(e2e)-updateDesignationAgreement", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let fakeUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    fakeUser = await db.user.save(createFakeUser());
  });

  it("Should approve a designation agreement and persist all fields when all payload locations belong to the institution.", async () => {
    // Arrange
    const institution = await db.institution.save(createFakeInstitution());
    const fakeLocation = createFakeInstitutionLocation({ institution });
    const savedLocation = await db.institutionLocation.save(fakeLocation);
    const fakeDesignation = createFakeDesignationAgreement(
      {
        fakeInstitution: institution,
        fakeInstitutionLocations: [savedLocation],
        fakeUser,
      },
      {
        initialValue: { designationStatus: DesignationAgreementStatus.Pending },
      },
    );
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
    const auditUser = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
    const updatedDesignation = await db.designationAgreement.findOne({
      select: {
        id: true,
        designationStatus: true,
        startDate: true,
        endDate: true,
        designationAgreementLocations: {
          id: true,
          institutionLocation: { id: true },
          approved: true,
        },
        institution: {
          id: true,
          notes: { id: true, noteType: true, description: true },
        },
        assessedBy: { id: true },
        assessedDate: true,
      },
      relations: {
        designationAgreementLocations: { institutionLocation: true },
        institution: { notes: true },
        assessedBy: true,
      },
      where: { id: savedDesignation.id },
      loadEagerRelations: false,
    });
    expect(updatedDesignation).toEqual({
      id: savedDesignation.id,
      designationStatus: DesignationAgreementStatus.Approved,
      startDate: "2026-01-01",
      endDate: "2027-12-31",
      designationAgreementLocations: [
        {
          id: expect.any(Number),
          institutionLocation: { id: savedLocation.id },
          approved: true,
        },
      ],
      institution: {
        id: institution.id,
        notes: [
          {
            id: expect.any(Number),
            noteType: NoteType.Designation,
            description: "Designation approved.",
          },
        ],
      },
      assessedBy: { id: auditUser.id },
      assessedDate: expect.any(Date),
    });
  });

  it("Should decline a designation agreement.", async () => {
    // Arrange
    const institution = await db.institution.save(createFakeInstitution());
    const fakeLocation = createFakeInstitutionLocation({ institution });
    const savedLocation = await db.institutionLocation.save(fakeLocation);
    const fakeDesignation = createFakeDesignationAgreement(
      {
        fakeInstitution: institution,
        fakeInstitutionLocations: [savedLocation],
        fakeUser,
      },
      {
        initialValue: { designationStatus: DesignationAgreementStatus.Pending },
      },
    );
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
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message:
          "Designation agreement not found or it has been declined already.",
        error: "Not Found",
      });
  });

  it("Should return unprocessable entity when approved location does not belong to the designation institution.", async () => {
    // Arrange
    const institution = await db.institution.save(createFakeInstitution());
    const fakeLocation = createFakeInstitutionLocation({ institution });
    const savedLocation = await db.institutionLocation.save(fakeLocation);
    const fakeDesignation = createFakeDesignationAgreement(
      {
        fakeInstitution: institution,
        fakeInstitutionLocations: [savedLocation],
        fakeUser,
      },
      {
        initialValue: { designationStatus: DesignationAgreementStatus.Pending },
      },
    );
    const savedDesignation =
      await db.designationAgreement.save(fakeDesignation);
    // Create a location that belongs to a different institution.
    const unrelatedLocation = await db.institutionLocation.save(
      createFakeInstitutionLocation(),
    );
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
          { locationId: unrelatedLocation.id, approved: true },
        ],
        note: "Attempt with unrelated location.",
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "One or more locations provided do not belong to designation institution.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should return unprocessable entity when an approved location is missing an institution location code.", async () => {
    // Arrange
    const institution = await db.institution.save(createFakeInstitution());
    // Create a location without an institution code to simulate locations
    // submitted with the "I do not have an institution location code" option selected.
    const fakeLocation = createFakeInstitutionLocation({ institution });
    fakeLocation.institutionCode = undefined;
    const savedLocation = await db.institutionLocation.save(fakeLocation);
    const fakeDesignation = createFakeDesignationAgreement(
      {
        fakeInstitution: institution,
        fakeInstitutionLocations: [savedLocation],
        fakeUser,
      },
      {
        initialValue: { designationStatus: DesignationAgreementStatus.Pending },
      },
    );
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
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });
  afterAll(async () => {
    await app?.close();
  });
});
