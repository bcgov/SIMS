import { ASSESSMENT_ID } from "@sims/services/workflow/variables/assessment-gateway";
import {
  ApplicationExceptionStatus,
  AssessmentTriggerType,
  ProgramInfoStatus,
} from "@sims/sims-db";
import { ZBClient } from "zeebe-node";
import {
  createFakeConsolidatedFulltimeData,
  ZeebeMockedClient,
  E2E_STUDENT_STATUS,
  E2E_APPLICATION_EXCEPTION_STATUS,
  E2E_PIR_STATUS,
  PROCESS_INSTANCE_CREATE_TIMEOUT,
} from "../../test-utils";
import { PROGRAM_YEAR } from "../constants/program-year.constants";

describe(`E2E Test Workflow assessment gateway on original assessment for ${PROGRAM_YEAR}`, () => {
  let zeebeClientProvider: ZBClient;
  beforeAll(async () => {
    zeebeClientProvider = ZeebeMockedClient.getMockedZeebeInstance();
  });

  it("Should follow the expected workflow path when student single and independent without application exception and PIR.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.assessmentTriggerType =
      AssessmentTriggerType.OriginalAssessment;

    // Act/Assert
    const assessmentGatewayResponse =
      await zeebeClientProvider.createProcessInstanceWithResult({
        bpmnProcessId: "assessment-gateway",
        variables: {
          ...assessmentConsolidatedData,
          [ASSESSMENT_ID]: 1,
          [E2E_STUDENT_STATUS]: "independentSingleStudent",
          [E2E_APPLICATION_EXCEPTION_STATUS]:
            ApplicationExceptionStatus.Approved,
          [E2E_PIR_STATUS]: ProgramInfoStatus.notRequired,
        },
        requestTimeout: PROCESS_INSTANCE_CREATE_TIMEOUT,
      });
    // Workflow instance expected to pass through associate workflow instance worker.
    expect(
      assessmentGatewayResponse.variables["associate-workflow-instance"],
    ).toBe(true);
    // Workflow instance expected to pass through verify application exceptions worker.
    expect(
      assessmentGatewayResponse.variables["verify-application-exceptions"],
    ).toBe(true);
    // Workflow instance expected to pass through program info request worker.
    expect(assessmentGatewayResponse.variables["program-info-request"]).toBe(
      true,
    );
    // Workflow instance expected to pass through save disbursement schedules worker.
    expect(
      assessmentGatewayResponse.variables["save-disbursement-schedules"],
    ).toBe(true);
    // Workflow instance expected to pass through save associate msfaa worker
    // as this is original assessment.
    expect(assessmentGatewayResponse.variables["associate-msfaa"]).toBe(true);
    // Workflow instance expected to pass through save update noa status.
    expect(assessmentGatewayResponse.variables["update-noa-status"]).toBe(true);
  });
});
