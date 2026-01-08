import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  createE2EDataSources,
  createFakeEducationProgramOffering,
  createFakeInstitutionLocation,
  E2EDataSources,
} from "@sims/test-utils";
import { Institution, InstitutionLocation, User } from "@sims/sims-db";
import {
  createTestingAppModule,
  getAuthRelatedEntities,
  InstitutionTokenTypes,
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  getInstitutionToken,
} from "../../../../testHelpers";
import { OfferingValidationWarnings } from "../../../../services";
import * as request from "supertest";

describe("EducationProgramOfferingInstitutionsController(e2e)-getOfferingDetails", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let collegeFUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const { institution, user } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeF = institution;
    collegeFUser = user;
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });

    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
  });

  it("Should return the requested offering by id", async () => {
    // Arrange
    const offering = createFakeEducationProgramOffering(
      {
        auditUser: collegeFUser,
        institution: collegeF,
        institutionLocation: collegeFLocation,
      },
      {
        initialValues: { submittedDate: new Date() },
      },
    );
    const savedOffering = await db.educationProgramOffering.save(offering);

    // Institution token.
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeFUser);
    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${savedOffering.educationProgram.id}/offering/${savedOffering.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        id: savedOffering.id,
        offeringName: savedOffering.name,
        studyStartDate: savedOffering.studyStartDate,
        studyEndDate: savedOffering.studyEndDate,
        actualTuitionCosts: savedOffering.actualTuitionCosts,
        programRelatedCosts: savedOffering.programRelatedCosts,
        mandatoryFees: savedOffering.mandatoryFees,
        exceptionalExpenses: savedOffering.exceptionalExpenses,
        offeringDelivered: savedOffering.offeringDelivered,
        lacksStudyBreaks: savedOffering.lacksStudyBreaks,
        offeringIntensity: savedOffering.offeringIntensity,
        yearOfStudy: savedOffering.yearOfStudy,
        isAviationOffering: savedOffering.isAviationOffering,
        aviationCredentialType: savedOffering.aviationCredentialType,
        hasOfferingWILComponent: savedOffering.hasOfferingWILComponent,
        offeringWILComponentType: null, // Value is undefined on savedOffering.
        studyPeriodBreakdown: {
          totalDays: savedOffering.studyBreaks?.totalDays,
          totalFundedWeeks: savedOffering.studyBreaks?.totalFundedWeeks,
        },
        offeringDeclaration: savedOffering.offeringDeclaration,
        submittedBy:
          savedOffering.submittedBy.firstName +
          " " +
          savedOffering.submittedBy.lastName,
        submittedDate: savedOffering.submittedDate.toISOString(),
        offeringStatus: savedOffering.offeringStatus,
        offeringType: savedOffering.offeringType,
        locationName: savedOffering.institutionLocation.name,
        institutionName:
          savedOffering.institutionLocation.institution.operatingName,
        assessedBy: "",
        assessedDate: savedOffering.assessedDate,
        courseLoad: savedOffering.courseLoad,
        hasExistingApplication: false,
        validationInfos: [],
        validationWarnings: [
          OfferingValidationWarnings.ProgramOfferingDeliveryMismatch,
          OfferingValidationWarnings.InvalidFundedStudyPeriodLength,
        ],
        parentOfferingId: savedOffering.parentOffering.id,
        isBCPrivate: false,
        isBCPublic: true,
        onlineInstructionMode: savedOffering.onlineInstructionMode,
        isOnlineDurationSameAlways: savedOffering.isOnlineDurationSameAlways,
        totalOnlineDuration: savedOffering.totalOnlineDuration,
        minimumOnlineDuration: savedOffering.minimumOnlineDuration,
        maximumOnlineDuration: savedOffering.maximumOnlineDuration,
      });
  });

  it("Should throw a HttpStatus Not Found (404) error when the offering doesn't exist.", async () => {
    const offering = createFakeEducationProgramOffering(
      {
        auditUser: collegeFUser,
        institution: collegeF,
      },
      {
        initialValues: { submittedDate: new Date() },
      },
    );
    const savedOffering = await db.educationProgramOffering.save(offering);

    // Institution token.
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeFUser);
    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${savedOffering.educationProgram.id}/offering/99999999`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND);
  });
});
