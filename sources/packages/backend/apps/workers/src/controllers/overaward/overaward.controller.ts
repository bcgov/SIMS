import { Controller } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe";
import { ZeebeJob, MustReturnJobActionAcknowledgement } from "zeebe-node";
import { ASSESSMENT_ID } from "@sims/services/workflow/variables/assessment-gateway";
import { MaxJobsToActivate } from "../../types";
import { OverawardJobInDTO } from "./overaward.dto";

@Controller()
export class OverawardController {
  @ZeebeWorker("overaward", {
    fetchVariable: [ASSESSMENT_ID],
    maxJobsToActivate: MaxJobsToActivate.Normal,
  })
  async overaward(
    job: Readonly<ZeebeJob<OverawardJobInDTO>>,
  ): Promise<MustReturnJobActionAcknowledgement> {
    console.log(job);
    return job.complete();
  }
}
