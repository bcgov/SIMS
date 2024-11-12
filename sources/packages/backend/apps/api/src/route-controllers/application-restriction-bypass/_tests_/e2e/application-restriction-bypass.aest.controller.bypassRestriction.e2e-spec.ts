import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  RestrictionCode,
  createE2EDataSources,
  createFakeUser,
  saveFakeApplication,
  saveFakeApplicationRestrictionBypass,
  saveFakeStudentRestriction,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import * as request from "supertest";
import {
  ApplicationStatus,
  NoteType,
  OfferingIntensity,
  Restriction,
  RestrictionActionType,
  RestrictionBypassBehaviors,
  User,
} from "@sims/sims-db";
import {
  ACTIVE_BYPASS_FOR_STUDENT_RESTRICTION_ALREADY_EXISTS,
  APPLICATION_IN_INVALID_STATE_FOR_APPLICATION_RESTRICTION_BYPASS_CREATION,
  STUDENT_RESTRICTION_IS_NOT_ACTIVE,
} from "../../../../constants";

describe("ApplicationRestrictionBypassAESTController(e2e)-bypassRestriction", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let sharedMinistryUser: User;
  let ptssrRestriction: Restriction;
  let endpoint: string;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sharedMinistryUser = await db.user.save(createFakeUser());
    ptssrRestriction = await db.restriction.findOneBy({
      restrictionCode: RestrictionCode.PTSSR,
    });
    endpoint = "/aest/application-restriction-bypass";
  });

  it("Should be able to create a bypass when there is not an active bypass for the same student.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      offeringIntensity: OfferingIntensity.partTime,
    });

    const studentRestriction = await saveFakeStudentRestriction(db.dataSource, {
      student: application.student,
      restriction: ptssrRestriction,
      resolutionNote: null,
      creator: sharedMinistryUser,
    });

    const payload = {
      applicationId: application.id,
      studentRestrictionId: studentRestriction.id,
      bypassBehavior: RestrictionBypassBehaviors.NextDisbursementOnly,
      note: "test note",
    };
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    let applicationRestrictionBypassId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        applicationRestrictionBypassId = response.body.id;
      });

    const applicationRestrictionBypass =
      await db.applicationRestrictionBypass.findOne({
        select: {
          id: true,
          application: { id: true },
          studentRestriction: { id: true },
          bypassBehavior: true,
          creationNote: { noteType: true, description: true },
          bypassCreatedDate: true,
          bypassCreatedBy: { id: true },
          bypassRemovedDate: true,
          createdAt: true,
          isActive: true,
        },
        relations: {
          application: true,
          studentRestriction: true,
          creationNote: true,
          bypassCreatedBy: true,
        },
        where: { id: applicationRestrictionBypassId },
      });

    expect(applicationRestrictionBypass).toMatchObject({
      id: applicationRestrictionBypassId,
      application: { id: application.id },
      studentRestriction: { id: studentRestriction.id },
      bypassBehavior: payload.bypassBehavior,
      creationNote: {
        noteType: NoteType.Application,
        description: payload.note,
      },
      bypassCreatedDate: expect.any(Date),
      bypassCreatedBy: { id: expect.any(Number) },
      bypassRemovedDate: null,
      createdAt: expect.any(Date),
      isActive: true,
    });
  });

  it("Should throw an HTTP error while creating a bypass when there is an active bypass for the same active student restriction.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      offeringIntensity: OfferingIntensity.partTime,
    });
    const restrictionBypass = await saveFakeApplicationRestrictionBypass(
      db,
      {
        application,
        bypassCreatedBy: sharedMinistryUser,
        creator: sharedMinistryUser,
      },
      {
        restrictionActionType: RestrictionActionType.StopPartTimeDisbursement,
        restrictionCode: RestrictionCode.PTSSR,
      },
    );
    const payload = {
      applicationId: application.id,
      studentRestrictionId: restrictionBypass.studentRestriction.id,
      bypassBehavior: RestrictionBypassBehaviors.NextDisbursementOnly,
      note: "test note",
    };
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Cannot create a bypass when there is an active bypass for the same active student restriction.",
        errorType: ACTIVE_BYPASS_FOR_STUDENT_RESTRICTION_ALREADY_EXISTS,
      });
  });

  it("Should throw an HTTP error while creating a bypass when student restriction is not active.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      offeringIntensity: OfferingIntensity.partTime,
    });

    const studentRestriction = await saveFakeStudentRestriction(
      db.dataSource,
      {
        student: application.student,
        restriction: ptssrRestriction,
        application,
        resolutionNote: null,
        creator: sharedMinistryUser,
      },
      {
        isActive: false,
      },
    );

    const payload = {
      applicationId: application.id,
      studentRestrictionId: studentRestriction.id,
      bypassBehavior: RestrictionBypassBehaviors.NextDisbursementOnly,
      note: "test note",
    };
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Cannot create a bypass when student restriction is not active.",
        errorType: STUDENT_RESTRICTION_IS_NOT_ACTIVE,
      });
  });

  it("Should throw an HTTP error while creating a bypass when the student application is in draft.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      offeringIntensity: OfferingIntensity.partTime,
      applicationStatus: ApplicationStatus.Draft,
    });

    const studentRestriction = await saveFakeStudentRestriction(db.dataSource, {
      student: application.student,
      restriction: ptssrRestriction,
      resolutionNote: null,
      creator: sharedMinistryUser,
    });

    const payload = {
      applicationId: application.id,
      studentRestrictionId: studentRestriction.id,
      bypassBehavior: RestrictionBypassBehaviors.NextDisbursementOnly,
      note: "test note",
    };
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "Cannot create a bypass when application is in invalid state.",
        errorType:
          APPLICATION_IN_INVALID_STATE_FOR_APPLICATION_RESTRICTION_BYPASS_CREATION,
      });
  });

  it("Should throw an HTTP error while creating a bypass when the student application is in cancelled.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      offeringIntensity: OfferingIntensity.partTime,
      applicationStatus: ApplicationStatus.Cancelled,
    });

    const studentRestriction = await saveFakeStudentRestriction(db.dataSource, {
      student: application.student,
      restriction: ptssrRestriction,
      resolutionNote: null,
      creator: sharedMinistryUser,
    });

    const payload = {
      applicationId: application.id,
      studentRestrictionId: studentRestriction.id,
      bypassBehavior: RestrictionBypassBehaviors.NextDisbursementOnly,
      note: "test note",
    };
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "Cannot create a bypass when application is in invalid state.",
        errorType:
          APPLICATION_IN_INVALID_STATE_FOR_APPLICATION_RESTRICTION_BYPASS_CREATION,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
