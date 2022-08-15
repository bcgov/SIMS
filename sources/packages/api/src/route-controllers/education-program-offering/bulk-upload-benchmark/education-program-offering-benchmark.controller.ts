import { Controller, Param, Get } from "@nestjs/common";
import { AuthorizedParties } from "../../../auth/authorized-parties.enum";
import { AllowAuthorizedParty } from "../../../auth/decorators";
import { FormNames } from "../../../services/form/constants";
import { FormService } from "../../../services";
import { ApiTags } from "@nestjs/swagger";
import { OFFERING_SAMPLE } from "./offering-sample";
import BaseController from "../../../route-controllers/BaseController";
import { DryRunSubmissionResult } from "../../../types";
import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("offering-benchmark")
@ApiTags("offering-benchmark(test only, to be deleted)")
export class EducationProgramOfferingBenchmarkController extends BaseController {
  constructor(private readonly formService: FormService) {
    super();
  }

  @Get("calls/:calls/max-parallel-calls/:maxParallelCalls")
  async runBenchmark(
    @Param("calls") calls: number,
    @Param("maxParallelCalls") maxParallelCalls: number,
  ): Promise<any> {
    const queue: queueAsPromised<any, DryRunSubmissionResult> = fastq.promise(
      this.executeDryRun,
      maxParallelCalls,
    );

    const allPromises: Promise<DryRunSubmissionResult>[] = [];
    for (let i = 0; i < calls; i++) {
      const promise = queue.push({
        formService: this.formService,
        payload: OFFERING_SAMPLE,
        jobIndex: i,
      });

      allPromises.push(promise);
    }
    await Promise.all(allPromises);
    console.info(`Done.`);
  }

  private async executeDryRun(args: any): Promise<DryRunSubmissionResult> {
    return args.formService.dryRunSubmission(
      FormNames.EducationProgramOffering,
      args.payload,
    );
  }
}
