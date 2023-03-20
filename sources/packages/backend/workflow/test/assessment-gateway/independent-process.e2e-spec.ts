import { AssessmentTriggerType, OfferingIntensity } from "@sims/sims-db";
import { ZBClient } from "zeebe-node";
import {
  createFakeAssessmentConsolidatedData,
  createZeebeClient,
} from "../test-utils";

describe("E2E Test Workflow  independent process ", () => {
  let zeebeClientProvider: ZBClient;
  beforeAll(async () => {
    zeebeClientProvider = createZeebeClient();
  });

  it("Should generate expected fulltime assessment values for a single and independent student.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeAssessmentConsolidatedData("2022-2023");
    assessmentConsolidatedData.offeringIntensity = OfferingIntensity.fullTime;
    assessmentConsolidatedData.offeringStudyStartDate = "2023-02-01";
    assessmentConsolidatedData.offeringStudyEndDate = "2023-05-24";
    assessmentConsolidatedData.assessmentTriggerType =
      AssessmentTriggerType.StudentAppeal;

    zeebeClientProvider.createWorker({
      taskType: "load-assessment-consolidated-data",
      fetchVariable: ["assessmentId", "assessmentType"],
      taskHandler: (job) => {
        if (job.variables.assessmentType === "test") {
          return job.complete(assessmentConsolidatedData);
        }
      },
    });

    await zeebeClientProvider.createProcessInstanceWithResult(
      "assessment-gateway",
      { assessmentId: 1, assessmentType: "test" },
    );
  });
});
