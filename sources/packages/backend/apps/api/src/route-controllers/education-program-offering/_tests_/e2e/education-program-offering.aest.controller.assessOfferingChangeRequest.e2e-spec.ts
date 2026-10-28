import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  InstitutionTokenTypes,
  authorizeUserTokenForLocation,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
  getAuthRelatedEntities,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeEducationProgramOffering,
  createFakeInstitutionLocation,
  createFakeStudentAppeal,
  createFakeUser,
  getProviderInstanceForModule,
  saveFakeApplication,
  getMostRecentEducationProgramConfiguration,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  EducationProgramConfiguration,
  EducationProgramOffering,
  FormSubmissionCancellationReason,
  InstitutionLocation,
  OfferingStatus,
  StudentAssessmentStatus,
  User,
} from "@sims/sims-db";
import { OfferingChangeAssessmentAPIInDTO } from "../../models/education-program-offering.dto";
import { EntityManager, In } from "typeorm";
import MockDate from "mockdate";
import { AppAESTModule } from "../../../../app.aest.module";
import { FormSubmissionCancellationService } from "../../../../services";

describe("EducationProgramOfferingAESTController(e2e)-assessOfferingChangeRequest", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let cancelApplicationScopedFormSubmissionsSpy: jest.SpyInstance;
  let collegeFLocation: InstitutionLocation;
  let savedUser: User;
  let ministryUser: User;
  let precedingOffering: EducationProgramOffering;
  let requestedOffering: EducationProgramOffering;
  let mostRecentProgramConfiguration: EducationProgramConfiguration;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const formSubmissionCancellationService =
      await getProviderInstanceForModule(
        module,
        AppAESTModule,
        FormSubmissionCancellationService,
      );
    cancelApplicationScopedFormSubmissionsSpy = jest.spyOn(
      formSubmissionCancellationService,
      "cancelApplicationScopedFormSubmissions",
    );
    mostRecentProgramConfiguration =
      await getMostRecentEducationProgramConfiguration({ db });
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
    const auditUser = await getAESTUser(
      dataSource,
      AESTGroups.BusinessAdministrators,
    );
    ministryUser = { id: auditUser.id } as User;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    MockDate.reset();
    precedingOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
      programConfiguration: mostRecentProgramConfiguration,
    });
    requestedOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
      programConfiguration: mostRecentProgramConfiguration,
    });
    precedingOffering.offeringStatus = OfferingStatus.ChangeAwaitingApproval;
    requestedOffering.offeringStatus = OfferingStatus.ChangeAwaitingApproval;
    requestedOffering.precedingOffering = precedingOffering;
    await db.educationProgramOffering.save([
      precedingOffering,
      requestedOffering,
    ]);
  });

  it("Should throw unprocessable entity exception error when the offering is not found.", async () => {
    // Arrange
    const payload: OfferingChangeAssessmentAPIInDTO = {
      offeringStatus: OfferingStatus.Approved,
      assessmentNotes: "notes",
    };
    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    const endpoint = getEndpoint({ offeringId: 0 });

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
      programConfiguration: mostRecentProgramConfiguration,
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

    const endpoint = getEndpoint({
      offeringId: offeringNoPrecedingOffering.id,
    });

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

    const endpoint = getEndpoint({ offeringId: requestedOffering.id });

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

  it("Should determine the offering change for an offering without any associated application when the offering change is approved.", async () => {
    // Arrange
    const payload: OfferingChangeAssessmentAPIInDTO = {
      offeringStatus: OfferingStatus.Approved,
      assessmentNotes: "offering change approved",
    };
    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    const endpoint = getEndpoint({ offeringId: requestedOffering.id });

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
    expect(queryRequestedOffering.offeringStatus).toBe(OfferingStatus.Approved);
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
  });

  it("Should determine the offering change for an offering with one or more applications in Completed status when the offering change is approved.", async () => {
    // Arrange
    const applications = await Promise.all(
      Array.from({ length: 2 }, () =>
        saveFakeApplication(
          db.dataSource,
          {
            institution: collegeFLocation.institution,
            institutionLocation: collegeFLocation,
            offering: precedingOffering,
          },
          {
            applicationStatus: ApplicationStatus.Completed,
          },
        ),
      ),
    );
    applications.forEach((application) => {
      // Create a student appeal for the application and its student assessment.
      const studentAppeal = createFakeStudentAppeal({
        application: application,
        studentAssessment: application.currentAssessment,
      });
      application.currentAssessment.studentAppeal = studentAppeal;
    });
    await db.application.save(applications);
    const applicationIds = applications.map((application) => application.id);

    const payload: OfferingChangeAssessmentAPIInDTO = {
      offeringStatus: OfferingStatus.Approved,
      assessmentNotes: "offering change approved",
    };
    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    const endpoint = getEndpoint({ offeringId: requestedOffering.id });

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
        id: In(applicationIds),
      },
    });
    queryApplications.forEach((queryApplication) => {
      expect(queryApplication.currentAssessment.triggerType).toBe(
        AssessmentTriggerType.OfferingChange,
      );
      expect(
        queryApplication.currentAssessment.studentAppeal.id,
      ).toBeGreaterThan(0);
    });
  });

  it("Should approve the offering change when the offering has one or more applications not in Completed status and add a institution note on approval.", async () => {
    // Arrange
    const notCompletedApplicationStatus = [
      ApplicationStatus.InProgress,
      ApplicationStatus.Assessment,
      ApplicationStatus.Enrolment,
    ];
    const applications = await Promise.all(
      notCompletedApplicationStatus.map((applicationStatus) =>
        saveFakeApplication(
          db.dataSource,
          {
            institution: collegeFLocation.institution,
            institutionLocation: collegeFLocation,
            offering: precedingOffering,
          },
          {
            applicationStatus: applicationStatus,
          },
        ),
      ),
    );
    const applicationIds = applications.map((application) => application.id);

    const payload: OfferingChangeAssessmentAPIInDTO = {
      offeringStatus: OfferingStatus.Approved,
      assessmentNotes: "offering change approved",
    };
    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    const endpoint = getEndpoint({ offeringId: requestedOffering.id });

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    const queryApplications = await db.application.find({
      select: {
        id: true,
        applicationStatus: true,
        currentAssessment: {
          studentAssessmentStatus: true,
        },
      },
      relations: {
        currentAssessment: true,
      },
      where: {
        id: In(applicationIds),
      },
    });
    queryApplications.forEach((queryApplication) => {
      expect(queryApplication.applicationStatus).toBe(
        ApplicationStatus.Cancelled,
      );
      expect(queryApplication.currentAssessment.studentAssessmentStatus).toBe(
        StudentAssessmentStatus.CancellationRequested,
      );
    });

    const processedPrecedingOffering =
      await db.educationProgramOffering.findOne({
        select: {
          id: true,
          offeringStatus: true,
        },
        where: {
          id: precedingOffering.id,
        },
      });
    expect(processedPrecedingOffering.offeringStatus).toBe(
      OfferingStatus.ChangeOverwritten,
    );

    const processedRequestedOffering =
      await db.educationProgramOffering.findOne({
        select: {
          id: true,
          institutionLocation: {
            id: true,
            institution: { id: true, notes: { id: true, description: true } },
          },
          offeringStatus: true,
          offeringNote: { id: true, description: true },
        },
        relations: {
          offeringNote: true,
          institutionLocation: { institution: { notes: true } },
        },
        where: {
          id: requestedOffering.id,
        },
      });
    expect(processedRequestedOffering.offeringStatus).toBe(
      OfferingStatus.Approved,
    );
    const notes =
      processedRequestedOffering.institutionLocation.institution.notes;
    expect(notes.length).toBe(1);
    expect(notes[0].id).toBe(processedRequestedOffering.offeringNote.id);
    expect(notes[0].description).toBe(payload.assessmentNotes);
  });

  it("Should request the cancellation of the application scoped form submissions when the offering change is approved and the application is cancelled.", async () => {
    // Arrange
    const application = await saveFakeApplication(
      db.dataSource,
      {
        institution: collegeFLocation.institution,
        institutionLocation: collegeFLocation,
        offering: precedingOffering,
      },
      {
        applicationStatus: ApplicationStatus.Assessment,
      },
    );
    const payload: OfferingChangeAssessmentAPIInDTO = {
      offeringStatus: OfferingStatus.Approved,
      assessmentNotes: "offering change approved",
    };
    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = getEndpoint({ offeringId: requestedOffering.id });
    const now = new Date();
    MockDate.set(now);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Verify if the application is cancelled.
    const updatedApplication = await db.application.findOne({
      select: { id: true, applicationStatus: true },
      where: { id: application.id },
    });
    expect(updatedApplication.applicationStatus).toBe(
      ApplicationStatus.Cancelled,
    );
    // Verify if the cancellation of the application scoped form submissions was requested.
    expect(cancelApplicationScopedFormSubmissionsSpy).toHaveBeenCalledTimes(1);
    expect(cancelApplicationScopedFormSubmissionsSpy).toHaveBeenCalledWith(
      application.id,
      FormSubmissionCancellationReason.ApplicationCancelled,
      ministryUser.id,
      now,
      expect.any(EntityManager),
    );
  });

  it(
    "Should not request the cancellation of the application scoped form submissions when the offering change is approved" +
      ` and the application is in ${ApplicationStatus.Completed} status.`,
    async () => {
      // Arrange
      const application = await saveFakeApplication(
        db.dataSource,
        {
          institution: collegeFLocation.institution,
          institutionLocation: collegeFLocation,
          offering: precedingOffering,
        },
        {
          applicationStatus: ApplicationStatus.Completed,
        },
      );
      const payload: OfferingChangeAssessmentAPIInDTO = {
        offeringStatus: OfferingStatus.Approved,
        assessmentNotes: "offering change approved",
      };
      // Ministry token.
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);
      const endpoint = getEndpoint({ offeringId: requestedOffering.id });

      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);

      // Verify if the application was not cancelled.
      const updatedApplication = await db.application.findOne({
        select: { id: true, applicationStatus: true },
        where: { id: application.id },
      });
      expect(updatedApplication.applicationStatus).toBe(
        ApplicationStatus.Completed,
      );
      // Verify if the cancellation of the application scoped form submissions was not requested.
      expect(cancelApplicationScopedFormSubmissionsSpy).not.toHaveBeenCalled();
    },
  );

  it(
    "Should not cancel the application or request the cancellation of its application scoped form submissions when the offering change is declined" +
      ` and the application is in ${ApplicationStatus.Assessment} status.`,
    async () => {
      // Arrange
      const application = await saveFakeApplication(
        db.dataSource,
        {
          institution: collegeFLocation.institution,
          institutionLocation: collegeFLocation,
          offering: precedingOffering,
        },
        {
          applicationStatus: ApplicationStatus.Assessment,
        },
      );
      const payload: OfferingChangeAssessmentAPIInDTO = {
        offeringStatus: OfferingStatus.ChangeDeclined,
        assessmentNotes: "offering change declined",
      };
      // Ministry token.
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);
      const endpoint = getEndpoint({ offeringId: requestedOffering.id });

      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);

      // Verify if the application was not cancelled.
      const updatedApplication = await db.application.findOne({
        select: { id: true, applicationStatus: true },
        where: { id: application.id },
      });
      expect(updatedApplication.applicationStatus).toBe(
        ApplicationStatus.Assessment,
      );
      // Verify if the cancellation of the application scoped form submissions was not requested.
      expect(cancelApplicationScopedFormSubmissionsSpy).not.toHaveBeenCalled();
    },
  );

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Get the endpoint for assessing an offering change request.
 * @param options method options.
 * - `offeringId` ID of the offering requested for change.
 * @returns endpoint for assessing an offering change request.
 */
function getEndpoint(options: { offeringId: number }): string {
  return `/aest/education-program-offering/${options.offeringId}/assess-change-request`;
}
