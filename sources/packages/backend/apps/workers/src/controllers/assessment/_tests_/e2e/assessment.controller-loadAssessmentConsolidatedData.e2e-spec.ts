import {
  createE2EDataSources,
  createFakeCRAIncomeVerification,
  createFakeSupportingUser,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  FAKE_WORKER_JOB_RESULT_PROPERTY,
  FakeWorkerJobResult,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createTestingAppModule } from "../../../../../test/helpers";
import { AssessmentController } from "../../assessment.controller";
import {} from "../../assessment.dto";
import {
  ApplicationData,
  AssessmentTriggerType,
  OfferingIntensity,
  RelationshipStatus,
  SupportingUserType,
} from "@sims/sims-db";
import { ICustomHeaders } from "@camunda8/sdk/dist/zeebe/types";
import { createFakeLoadAssessmentConsolidatedDataPayload } from "./load-assessment-consolidated-data-factory";

describe("AssessmentController(e2e)-loadAssessmentConsolidatedData", () => {
  let db: E2EDataSources;
  let assessmentController: AssessmentController;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    assessmentController = nestApplication.get(AssessmentController);
  });

  it(
    "Should load assessment consolidated data when the student is single and not a dependant" +
      " and the student income verification is completed.",
    async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource, undefined, {
        applicationData: {
          relationshipStatus: RelationshipStatus.Single,
          dependantstatus: "independant",
          taxReturnIncome: 1000,
          workflowName: "dummy",
        } as ApplicationData,
        offeringIntensity: OfferingIntensity.partTime,
      });
      // Create student CRA income verification.
      const studentCRAIncomeVerification = createFakeCRAIncomeVerification(
        {
          application,
        },
        {
          initialValues: { dateReceived: new Date(), craReportedIncome: 900 },
        },
      );
      await db.craIncomeVerification.save(studentCRAIncomeVerification);

      const assessment = application.currentAssessment;
      const offering = assessment.offering;
      const programYear = application.programYear;
      const program = offering.educationProgram;

      const customHeaders = createBaseCustomHeaders();

      // Act
      const result = await assessmentController.loadAssessmentConsolidatedData(
        createFakeLoadAssessmentConsolidatedDataPayload(
          assessment.id,
          customHeaders,
        ),
      );

      // Asserts
      expect(result).toHaveProperty(
        FAKE_WORKER_JOB_RESULT_PROPERTY,
        MockedZeebeJobResult.Complete,
      );
      // Validate the output variables.
      expect(FakeWorkerJobResult.getOutputVariables(result)).toEqual({
        assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
        programYearStartDate: programYear.startDate,
        studentDataRelationshipStatus: RelationshipStatus.Single,
        studentDataTaxReturnIncome: 1000,
        studentDataDependantstatus: "independant",
        applicationId: application.id,
        programYear: programYear.programYear,
        institutionLocationProvince:
          offering.institutionLocation?.data.address?.provinceState,
        institutionType: "BC Private",
        programLength: program.completionYears,
        programCredentialType: program.credentialType,
        offeringIntensity: OfferingIntensity.partTime,
        offeringDelivered: offering.offeringDelivered,
        offeringStudyEndDate: offering.studyEndDate,
        offeringStudyStartDate: offering.studyStartDate,
        offeringProgramRelatedCosts: offering.programRelatedCosts,
        offeringActualTuitionCosts: offering.actualTuitionCosts,
        offeringMandatoryFees: offering.mandatoryFees,
        offeringExceptionalExpenses: offering.exceptionalExpenses,
        offeringCourseLoad: offering.courseLoad,
        offeringWeeks: offering.studyBreaks.totalFundedWeeks,
        applicationStatus: application.applicationStatus,
        applicationEditStatus: application.applicationEditStatus,
        applicationHasNOAApproval: false,
        studentDataCRAReportedIncome: 900,
        studentTaxYear: studentCRAIncomeVerification.taxYear,
      });
    },
  );

  it(
    "Should load assessment consolidated data when the student is married and not a dependant" +
      " and the student income verification and partner income verification is completed.",
    async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource, undefined, {
        applicationData: {
          relationshipStatus: RelationshipStatus.Single,
          dependantstatus: "independant",
          taxReturnIncome: 1000,
          workflowName: "dummy",
        } as ApplicationData,
        offeringIntensity: OfferingIntensity.partTime,
      });
      // Create supporting user partner.
      const partner = createFakeSupportingUser(
        { application },
        {
          initialValues: {
            supportingUserType: SupportingUserType.Partner,
            supportingData: { totalIncome: 2000 },
          },
        },
      );
      await db.supportingUser.save(partner);
      // Create student income verification.
      const studentCRAIncomeVerification = createFakeCRAIncomeVerification(
        {
          application,
        },
        {
          initialValues: { dateReceived: new Date(), craReportedIncome: 900 },
        },
      );
      // Create partner income verification.
      const partnerCRAIncomeVerification = createFakeCRAIncomeVerification(
        {
          application,
          supportingUser: partner,
        },
        {
          initialValues: { dateReceived: new Date(), craReportedIncome: 1900 },
        },
      );
      await db.craIncomeVerification.save([
        studentCRAIncomeVerification,
        partnerCRAIncomeVerification,
      ]);

      const assessment = application.currentAssessment;
      const offering = assessment.offering;
      const programYear = application.programYear;
      const program = offering.educationProgram;

      const customHeaders = {
        ...createBaseCustomHeaders(),
        partner1SupportingUserId: "$.supportingUsers.Partner1.id",
        partner1CRAReportedIncome:
          "$.supportingUsers.Partner1.craReportedIncome",
        partner1TotalIncome:
          "$.supportingUsers.Partner1.supportingData.totalIncome",
      };

      // Act
      const result = await assessmentController.loadAssessmentConsolidatedData(
        createFakeLoadAssessmentConsolidatedDataPayload(
          assessment.id,
          customHeaders,
        ),
      );

      // Asserts
      expect(result).toHaveProperty(
        FAKE_WORKER_JOB_RESULT_PROPERTY,
        MockedZeebeJobResult.Complete,
      );

      // Validate the output variables.
      expect(FakeWorkerJobResult.getOutputVariables(result)).toEqual({
        assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
        programYearStartDate: programYear.startDate,
        studentDataRelationshipStatus: RelationshipStatus.Single,
        studentDataTaxReturnIncome: 1000,
        studentDataDependantstatus: "independant",
        applicationId: application.id,
        programYear: programYear.programYear,
        institutionLocationProvince:
          offering.institutionLocation?.data.address?.provinceState,
        institutionType: "BC Private",
        programLength: program.completionYears,
        programCredentialType: program.credentialType,
        offeringIntensity: OfferingIntensity.partTime,
        offeringDelivered: offering.offeringDelivered,
        offeringStudyEndDate: offering.studyEndDate,
        offeringStudyStartDate: offering.studyStartDate,
        offeringProgramRelatedCosts: offering.programRelatedCosts,
        offeringActualTuitionCosts: offering.actualTuitionCosts,
        offeringMandatoryFees: offering.mandatoryFees,
        offeringExceptionalExpenses: offering.exceptionalExpenses,
        offeringCourseLoad: offering.courseLoad,
        offeringWeeks: offering.studyBreaks.totalFundedWeeks,
        applicationStatus: application.applicationStatus,
        applicationEditStatus: application.applicationEditStatus,
        applicationHasNOAApproval: false,
        studentDataCRAReportedIncome: 900,
        studentTaxYear: studentCRAIncomeVerification.taxYear,
        partner1SupportingUserId: partner.id,
        partner1CRAReportedIncome: 1900,
        partner1TotalIncome: 2000,
      });
    },
  );

  /**
   * Creates base custom headers.
   * @returns base custom headers
   */
  function createBaseCustomHeaders(): ICustomHeaders {
    return {
      assessmentTriggerType: "$.triggerType",
      programYearStartDate: "$.programYear.startDate",
      studentDataRelationshipStatus: "$.data.relationshipStatus",
      studentDataTaxReturnIncome: "$.data.taxReturnIncome",
      studentDataDependantstatus: "$.data.dependantstatus",
      applicationId: "$.applicationId",
      programYear: "$.programYear.programYear",
      institutionLocationProvince: "$.location.institutionLocationProvince",
      institutionType: "$.institution.institutionType",
      programLength: "$.program.programLength",
      programCredentialType: "$.program.programCredentialType",
      offeringIntensity: "$.offering.offeringIntensity",
      offeringDelivered: "$.offering.offeringDelivered",
      offeringStudyEndDate: "$.offering.studyEndDate",
      offeringStudyStartDate: "$.offering.studyStartDate",
      offeringProgramRelatedCosts: "$.offering.programRelatedCosts",
      offeringActualTuitionCosts: "$.offering.actualTuitionCosts",
      offeringMandatoryFees: "$.offering.mandatoryFees",
      offeringExceptionalExpenses: "$.offering.exceptionalExpenses",
      offeringCourseLoad: "$.offering.courseLoad",
      offeringWeeks: "$.offering.studyBreaks.totalFundedWeeks",
      applicationStatus: "$.applicationStatus",
      applicationEditStatus: "$.applicationEditStatus",
      applicationHasNOAApproval: "$.hasNOAApproval",
      studentDataCRAReportedIncome: "$.student.craReportedIncome",
      studentTaxYear: "$.student.taxYear",
    };
  }
});
