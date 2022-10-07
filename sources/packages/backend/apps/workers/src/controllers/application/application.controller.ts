import { Controller } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe/zeebe-worker.decorator";
import {
  ZeebeJob,
  ICustomHeaders,
  MustReturnJobActionAcknowledgement,
  IInputVariables,
  IOutputVariables,
} from "zeebe-node";

@Controller()
export class ApplicationController {
  @ZeebeWorker("update-application-status")
  async updateApplicationStatus(
    job: Readonly<ZeebeJob<IInputVariables, ICustomHeaders, IOutputVariables>>,
  ): Promise<MustReturnJobActionAcknowledgement> {
    console.dir("++++++++++++++++++++job.variables");
    console.dir(job.variables);
    return job.complete();
  }
}
