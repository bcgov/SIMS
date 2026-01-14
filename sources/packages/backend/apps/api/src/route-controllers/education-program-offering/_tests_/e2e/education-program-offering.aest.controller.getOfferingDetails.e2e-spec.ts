import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeEducationProgramOffering,
  createFakeUser,
} from "@sims/test-utils";
import { User } from "@sims/sims-db";
import * as request from "supertest";
import { OfferingValidationWarnings } from "../../../../services";

describe("EducationProgramOfferingAESTController(e2e)-getOfferingDetails", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let savedUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    savedUser = await db.user.save(createFakeUser());
  });

  it("Should return the requested offering by ID when it exists.", async () => {
    // Arrange
    const offering = createFakeEducationProgramOffering(
      {
        auditUser: savedUser,
      },
      {
        initialValues: { submittedDate: new Date() },
      },
    );
    const savedOffering = await db.educationProgramOffering.save(offering);

    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/education-program-offering/${savedOffering.id}`;

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
        institutionId: savedOffering.institutionLocation.institution.id,
        institutionName:
          savedOffering.institutionLocation.institution.operatingName,
        assessedBy: "",
        assessedDate: savedOffering.assessedDate,
        courseLoad: savedOffering.courseLoad,
        validationInfos: [],
        validationWarnings: [
          OfferingValidationWarnings.ProgramOfferingDeliveryMismatch,
          OfferingValidationWarnings.InvalidFundedStudyPeriodLength,
        ],
        parentOfferingId: savedOffering.parentOffering.id,
        isBCPrivate: true,
        isBCPublic: false,
        onlineInstructionMode: savedOffering.onlineInstructionMode,
        isOnlineDurationSameAlways: savedOffering.isOnlineDurationSameAlways,
        totalOnlineDuration: savedOffering.totalOnlineDuration,
        minimumOnlineDuration: savedOffering.minimumOnlineDuration,
        maximumOnlineDuration: savedOffering.maximumOnlineDuration,
      });
  });

  it("Should throw a HttpStatus Not Found (404) error when the offering doesn't exist.", async () => {
    // Arrange

    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/education-program-offering/99999999`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND);
  });
});
