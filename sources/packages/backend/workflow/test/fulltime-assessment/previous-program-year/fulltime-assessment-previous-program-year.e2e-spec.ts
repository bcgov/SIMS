import { Test, TestingModule } from "@nestjs/testing";
import { ZeebeModule } from "@sims/services";
import { OfferingIntensity } from "@sims/sims-db";
import { ZBClient } from "zeebe-node";
import {
  getFakeAssessmentConsolidatedData,
  PREVIOUS_PROGRAM_YEAR,
} from "../../utils";
import { AssessmentConsolidatedData } from "../../models";

describe(`E2E Test Workflow fulltime-assessment-${PREVIOUS_PROGRAM_YEAR}`, () => {
  let zeebeClientProvider: ZBClient;
  let assessmentConsolidatedData: AssessmentConsolidatedData;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ZeebeModule.forRoot()],
    }).compile();
    const app = moduleFixture.createNestApplication();
    await app.init();
    zeebeClientProvider = app.get(ZBClient);
    assessmentConsolidatedData = getFakeAssessmentConsolidatedData(
      OfferingIntensity.fullTime,
      PREVIOUS_PROGRAM_YEAR,
    );
  });

  it(`Should generate fulltime assessment values`, async () => {
    await zeebeClientProvider.createProcessInstanceWithResult(
      `fulltime-assessment-${PREVIOUS_PROGRAM_YEAR}`,
      assessmentConsolidatedData,
    );
  });
});
