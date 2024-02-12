import {
  createE2EDataSources,
  createFakeDisbursementValue,
  E2EDataSources,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  FAKE_WORKER_JOB_RESULT_PROPERTY,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createTestingAppModule } from "../../../../../test/helpers";
import { AssessmentController } from "../../assessment.controller";
import {
  ApplicationStatus,
  DisbursementValueType,
  OfferingIntensity,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import { addDays } from "@sims/utilities";
import { createFakeVerifyAssessmentCalculationOrderPayload } from "./verify-assessment-calculation-order-factory";

describe("AssessmentController(e2e)-verifyAssessmentCalculationOrder", () => {
  let db: E2EDataSources;
  let assessmentController: AssessmentController;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    assessmentController = nestApplication.get(AssessmentController);
  });

  it("Should sum the grants from two past applications with different offering intensities the applications are for the same student and program year in the future.", async () => {
    // Arrange

    // Create the student to be shared across the applications.
    const student = await saveFakeStudent(db.dataSource);
    // Past part-time application with federal and provincial loans and grants.
    // Loans will be ignored.
    await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        student,
        firstDisbursementValues: [
          createFakeDisbursementValue(
            DisbursementValueType.CanadaLoan,
            "CSLP",
            10000,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSPT",
            123,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSGD",
            456,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSGP",
            789,
          ),
          // Should not be disbursed due to BCLM restriction.
          createFakeDisbursementValue(
            DisbursementValueType.BCLoan,
            "BCSL",
            5000,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "SBSD ",
            1011,
          ),
          // Should not be disbursed due to BCLM restriction.
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "BCAG",
            1414,
          ),
        ],
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          assessmentDate: addDays(-2),
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
        },
      },
    );
    // Past full-time application with federal and provincial loans and grants.
    // Loans will be ignored.
    await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        student,
        firstDisbursementValues: [
          createFakeDisbursementValue(
            DisbursementValueType.CanadaLoan,
            "CSLF",
            11500,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSGD",
            456,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSGP",
            789,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCLoan,
            "BCSL",
            7599,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "SBSD ",
            1011,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "BCAG",
            1414,
          ),
        ],
      },
      {
        offeringIntensity: OfferingIntensity.fullTime,
        applicationStatus: ApplicationStatus.Completed,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          assessmentDate: addDays(-1),
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
        },
      },
    );
    // Application currently being processed.
    const currentApplication = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.InProgress,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          studentAssessmentStatus: StudentAssessmentStatus.InProgress,
        },
      },
    );

    // Act
    const result = await assessmentController.verifyAssessmentCalculationOrder(
      createFakeVerifyAssessmentCalculationOrderPayload(
        currentApplication.currentAssessment.id,
      ),
    );

    // Asserts
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );
    // TODO: assert below output.
    // isReadyForCalculation: true
    // programYearTotalBCAG: 2828
    // programYearTotalCSGD: 912
    // programYearTotalCSGP: 1578
    // programYearTotalCSPT: 123
    // programYearTotalSBSD: 2022
  });
});
