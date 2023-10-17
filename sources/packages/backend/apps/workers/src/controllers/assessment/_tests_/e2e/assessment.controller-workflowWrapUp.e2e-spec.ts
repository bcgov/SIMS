import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";

import { ICustomHeaders, IOutputVariables } from "zeebe-node";
import {
  createFakeWorkerJob,
  FAKE_WORKER_JOB_RESULT_PROPERTY,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createTestingAppModule } from "../../../../../test/helpers";
import { createFakeWorkflowWrapUpPayload } from "./workflow-wrap-up";
import { AssessmentController } from "../../assessment.controller";
import { WorkflowWrapUpJobInDTO } from "../../assessment.dto";
import {
  FormYesNoOptions,
  RelationshipStatus,
  StudentAssessmentStatus,
  WorkflowData,
} from "@sims/sims-db";

describe("AssessmentController(e2e)-workflowWrapUp", () => {
  let db: E2EDataSources;
  let assessmentController: AssessmentController;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    assessmentController = nestApplication.get(AssessmentController);
  });

  it(`Should update assessment status to completed when it does not have a status ${StudentAssessmentStatus.CancellationRequested}, ${StudentAssessmentStatus.CancellationQueued} or ${StudentAssessmentStatus.Cancelled}.`, async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);
    const workflowData: WorkflowData = {
      studentData: {
        dependantStatus: "independant",
        relationshipStatus: RelationshipStatus.Married,
        livingWithParents: FormYesNoOptions.No,
        numberOfParents: 2,
      },
      calculatedData: {
        parentalAssets: 12345,
        studentMaritalStatusCode: "MA",
        totalEligibleDependents: 0,
        familySize: 2,
        parentalAssetContribution: 0,
        parentalContribution: 0,
        parentDiscretionaryIncome: 0,
        dependantTotalMSOLAllowance: 0,
        studentMSOLAllowance: 0,
        totalChildCareCost: 0,
        totalNonEducationalCost: 0,
        dependantChildQuantity: 0,
        dependantChildInDaycareQuantity: 0,
        dependantInfantQuantity: 0,
        dependantDeclaredOnTaxesQuantity: 0,
        dependantPostSecondaryQuantity: 0,
        partnerStudentStudyWeeks: 0,
      },
    };
    const workflowWrapUpPayload = createFakeWorkflowWrapUpPayload(
      savedApplication.currentAssessment.id,
      workflowData,
    );

    // Act
    const result = await assessmentController.workflowWrapUp(
      createFakeWorkerJob<
        WorkflowWrapUpJobInDTO,
        ICustomHeaders,
        IOutputVariables
      >(workflowWrapUpPayload),
    );

    // Asserts
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    // Asserts that the student assessment status has changed to completed.
    const expectedAssessment = await db.studentAssessment.findOne({
      select: {
        studentAssessmentStatus: true,
        workflowData: {},
      },
      where: { id: savedApplication.currentAssessment.id },
    });
    expect(expectedAssessment.studentAssessmentStatus).toBe(
      StudentAssessmentStatus.Completed,
    );
    expect(expectedAssessment.workflowData).toEqual(workflowData);
  });
});
