import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  InstitutionTokenTypes,
  authorizeUserTokenForLocation,
  createTestingAppModule,
  getAESTToken,
  getAuthRelatedEntities,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeEducationProgramOffering,
  createFakeInstitutionLocation,
  createFakeStudentAppeal,
  createFakeUser,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  EducationProgramOffering,
  InstitutionLocation,
  OfferingStatus,
  User,
} from "@sims/sims-db";
import { OfferingChangeAssessmentAPIInDTO } from "apps/api/src/route-controllers/education-program-offering/models/education-program-offering.dto";

describe("EducationProgramOfferingAESTController(e2e)-assessOfferingChangeRequest", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeFLocation: InstitutionLocation;
  let savedUser: User;
  let precedingOffering: EducationProgramOffering;
  let requestedOffering: EducationProgramOffering;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const { institution: collegeF } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
    savedUser = await db.user.save(createFakeUser());
  });

  beforeEach(async () => {
    precedingOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
    });
    precedingOffering.offeringStatus = OfferingStatus.ChangeAwaitingApproval;
    await db.educationProgramOffering.save(precedingOffering);
    requestedOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
    });
    requestedOffering.offeringStatus = OfferingStatus.ChangeAwaitingApproval;
    requestedOffering.precedingOffering = precedingOffering;
    await db.educationProgramOffering.save(requestedOffering);
  });

  it("Should throw unprocessable entity exception error when the offering is not found.", async () => {
    // Arrange
    const payload: OfferingChangeAssessmentAPIInDTO = {
      offeringStatus: OfferingStatus.Approved,
      assessmentNotes: "notes",
    };
    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    const endpoint = `/aest/education-program-offering/000/assess-change-request`;

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message:
          "Either offering not found or the offering not in appropriate status to be approved or declined for change.",
        error: "Unprocessable Entity",
      });
  });

  it("Should throw unprocessable entity exception error when the offering does not have a preceding offering.", async () => {
    // Arrange
    const offeringNoPrecedingOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
    });
    offeringNoPrecedingOffering.offeringStatus =
      OfferingStatus.ChangeAwaitingApproval;
    await db.educationProgramOffering.save(offeringNoPrecedingOffering);
    const payload: OfferingChangeAssessmentAPIInDTO = {
      offeringStatus: OfferingStatus.Approved,
      assessmentNotes: "notes",
    };
    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    const endpoint = `/aest/education-program-offering/${offeringNoPrecedingOffering.id}/assess-change-request`;

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message:
          "The offering requested for change does not have a preceding offering.",
        error: "Unprocessable Entity",
      });
  });

  it("Should determine both of preceding and requested offerings when the offering change is declined.", async () => {
    // Arrange
    const payload: OfferingChangeAssessmentAPIInDTO = {
      offeringStatus: OfferingStatus.ChangeDeclined,
      assessmentNotes: "offering change declined",
    };
    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    const endpoint = `/aest/education-program-offering/${requestedOffering.id}/assess-change-request`;

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    const queryPrecedingOffering = await db.educationProgramOffering.findOne({
      select: {
        id: true,
        offeringStatus: true,
      },
      where: { id: precedingOffering.id },
    });
    const queryRequestedOffering = await db.educationProgramOffering.findOne({
      select: {
        id: true,
        offeringStatus: true,
        offeringNote: { id: true, description: true },
      },
      relations: { offeringNote: true },
      where: { id: requestedOffering.id },
    });
    expect(queryPrecedingOffering.offeringStatus).toBe(OfferingStatus.Approved);
    expect(queryRequestedOffering.offeringStatus).toBe(
      OfferingStatus.ChangeDeclined,
    );
    expect(queryRequestedOffering.offeringNote.description).toBe(
      "offering change declined",
    );
  });

  it(
    "Should determine both of preceding and requested offerings when the offering change is approved " +
      "and there is no applications associated with the requested offering.",
    async () => {
      // Arrange
      const payload: OfferingChangeAssessmentAPIInDTO = {
        offeringStatus: OfferingStatus.Approved,
        assessmentNotes: "offering change approved",
      };
      // Ministry token.
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      const endpoint = `/aest/education-program-offering/${requestedOffering.id}/assess-change-request`;

      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);

      const queryPrecedingOffering = await db.educationProgramOffering.findOne({
        select: {
          id: true,
          offeringStatus: true,
        },
        where: { id: precedingOffering.id },
      });
      const queryRequestedOffering = await db.educationProgramOffering.findOne({
        select: {
          id: true,
          offeringStatus: true,
          offeringNote: { id: true, description: true },
        },
        relations: { offeringNote: true },
        where: { id: requestedOffering.id },
      });
      expect(queryPrecedingOffering.offeringStatus).toBe(
        OfferingStatus.ChangeOverwritten,
      );
      expect(queryRequestedOffering.offeringStatus).toBe(
        OfferingStatus.Approved,
      );
      expect(queryRequestedOffering.offeringNote.description).toBe(
        "offering change approved",
      );
      const queryApplications = await db.application.find({
        select: {
          id: true,
          currentAssessment: {
            triggerType: true,
            offering: { id: true },
          },
        },
        relations: {
          currentAssessment: { offering: true },
        },
        where: {
          currentAssessment: {
            offering: { id: requestedOffering.id },
          },
        },
      });
      expect(queryApplications.length).toBe(0);
    },
  );

  it(
    "Should determine applications for a requested offering when the offering change is approved" +
      "and there are applications associated with the requested offering.",
    async () => {
      // Arrange
      for (let i = 0; i < 2; i++) {
        const application = await saveFakeApplication(
          db.dataSource,
          {
            institution: collegeFLocation.institution,
            institutionLocation: collegeFLocation,
          },
          {
            applicationStatus: ApplicationStatus.Completed,
          },
        );
        // Create a student appeal for the application and its student assessment.
        const studentAppeal = createFakeStudentAppeal({
          application: application,
          studentAssessment: application.currentAssessment,
        });
        application.currentAssessment.studentAppeal = studentAppeal;
        application.currentAssessment.offering = precedingOffering;
        await db.application.save(application);
      }

      const payload: OfferingChangeAssessmentAPIInDTO = {
        offeringStatus: OfferingStatus.Approved,
        assessmentNotes: "offering change approved",
      };
      // Ministry token.
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      const endpoint = `/aest/education-program-offering/${requestedOffering.id}/assess-change-request`;

      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);

      const queryApplications = await db.application.find({
        select: {
          id: true,
          currentAssessment: {
            triggerType: true,
            offering: { id: true },
            studentAppeal: { id: true },
          },
        },
        relations: {
          currentAssessment: { offering: true, studentAppeal: true },
        },
        where: {
          currentAssessment: {
            offering: { id: requestedOffering.id },
          },
        },
      });
      expect(queryApplications.length).toBe(2);
      queryApplications.forEach((queryApplication) => {
        expect(queryApplication.currentAssessment.triggerType).toBe(
          AssessmentTriggerType.OfferingChange,
        );
        expect(
          queryApplication.currentAssessment.studentAppeal.id,
        ).toBeGreaterThan(0);
      });
    },
  );

  afterAll(async () => {
    await app?.close();
  });
});
