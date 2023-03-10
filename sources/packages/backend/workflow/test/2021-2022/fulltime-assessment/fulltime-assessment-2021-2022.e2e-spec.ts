import { OfferingIntensity } from "@sims/sims-db";
import { ZBClient } from "zeebe-node";
import { getFakeAssessmentConsolidatedData } from "../../utils";
import { PROGRAM_YEAR } from "../constants/program-year.constants";

describe(`E2E Test Workflow  fulltime-assessment-${PROGRAM_YEAR}`, () => {
  let zeebeClientProvider: ZBClient;
  beforeAll(async () => {
    zeebeClientProvider = new ZBClient();
  });

  it("Should generate fulltime assessment values", async () => {
    const assessmentConsolidatedData = getFakeAssessmentConsolidatedData(
      OfferingIntensity.fullTime,
      PROGRAM_YEAR,
    );
    await zeebeClientProvider.createProcessInstanceWithResult(
      `fulltime-assessment-${PROGRAM_YEAR}`,
      assessmentConsolidatedData,
    );
  });
});
