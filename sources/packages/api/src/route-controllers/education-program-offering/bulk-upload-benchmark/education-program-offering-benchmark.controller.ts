// import { Controller, Param, Get } from "@nestjs/common";
// import { AuthorizedParties } from "../../../auth/authorized-parties.enum";
// import { AllowAuthorizedParty } from "../../../auth/decorators";
// import { FormNames } from "../../../services/form/constants";
// import { FormService } from "../../../services";
// import { ApiTags } from "@nestjs/swagger";
// import { OFFERING_SAMPLE, OFFERING_SAMPLE_NO_DRY_RUN } from "./offering-sample";
// import BaseController from "../../../route-controllers/BaseController";
// import { DryRunSubmissionResult } from "../../../types";
// import * as fastq from "fastq";
// import type { queueAsPromised } from "fastq";
// import { EducationProgramOfferingValidationService } from "../../../services/education-program-offering/education-program-offering-validation.service";
// import { SaveOfferingModel } from "../../../services/education-program-offering/education-program-offering-validation.models";

// @AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
// @Controller("offering-benchmark")
// @ApiTags("offering-benchmark(test only, to be deleted)")
// export class EducationProgramOfferingBenchmarkController extends BaseController {
//   constructor(
//     private readonly formService: FormService,
//     private readonly validationService: EducationProgramOfferingValidationService,
//   ) {
//     super();
//   }

//   @Get("calls/:calls/max-parallel-calls/:maxParallelCalls")
//   async runBenchmark(
//     @Param("calls") calls: number,
//     @Param("maxParallelCalls") maxParallelCalls: number,
//   ): Promise<any> {
//     const queue: queueAsPromised<any, DryRunSubmissionResult> = fastq.promise(
//       this.executeDryRun,
//       maxParallelCalls,
//     );

//     const allPromises: Promise<DryRunSubmissionResult>[] = [];
//     for (let i = 0; i < calls; i++) {
//       const promise = queue.push({
//         formService: this.formService,
//         payload: OFFERING_SAMPLE,
//         jobIndex: i,
//       });

//       allPromises.push(promise);
//     }
//     await Promise.all(allPromises);
//     console.info(`Done.`);
//   }

//   private async executeDryRun(args: any): Promise<DryRunSubmissionResult> {
//     return args.formService.dryRunSubmission(
//       FormNames.EducationProgramOffering,
//       args.payload,
//     );
//   }

//   @Get("no-dry-run/:calls/max-parallel-calls/:maxParallelCalls")
//   async runBenchmarkNoDryRun(
//     @Param("calls") calls: number,
//     @Param("maxParallelCalls") maxParallelCalls: number,
//   ): Promise<any> {
//     const [validatedOffering] = this.validationService.validateOfferingModels([
//       OFFERING_SAMPLE_NO_DRY_RUN as SaveOfferingModel,
//     ]);
//     console.dir(validatedOffering);

//     // const queue: queueAsPromised<any, void> = fastq.promise(
//     //   this.processOffering,
//     //   maxParallelCalls,
//     // );

//     // const allPromises: Promise<void>[] = [];
//     // for (let i = 0; i < calls; i++) {
//     //   const promise = queue.push({
//     //     validationService: this.validationService,
//     //     payload: OFFERING_SAMPLE_NO_DRY_RUN,
//     //   });

//     //   allPromises.push(promise);
//     // }
//     // await Promise.all(allPromises);
//     console.info(`Done.`);
//   }

//   private async processOffering(args: any): Promise<void> {
//     const [validatedOffering] = args.validationService.validateOfferingModels([
//       args.payload,
//     ]);
//     // console.dir(validatedOffering.validationErrors);
//     // console.dir(
//     //   args.validationService.flattenErrorMessages(
//     //     validatedOffering.validationErrors,
//     //   ),
//     // );
//     // console.dir(
//     //   args.validationService.getOfferingSavingStatus(
//     //     validatedOffering.validationErrors,
//     //   ),
//     // );
//     // console.dir(
//     //   args.validationService.getOfferingSavingWarnings(
//     //     validatedOffering.validationErrors,
//     //   ),
//     // );
//   }
// }
