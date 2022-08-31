import { Controller, Param, Get } from "@nestjs/common";
import { AuthorizedParties } from "../../../auth/authorized-parties.enum";
import { AllowAuthorizedParty } from "../../../auth/decorators";
import { FormNames } from "../../../services/form/constants";
import { FormService } from "../../../services";
import { ApiTags } from "@nestjs/swagger";
import { OFFERING_SAMPLE, OFFERING_SAMPLE_NO_DRY_RUN } from "./offering-sample";
import BaseController from "../../../route-controllers/BaseController";
import { DryRunSubmissionResult } from "../../../types";
import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { EducationProgramOfferingCreationService } from "../../../services/education-program-offering/education-program-offering-creation.service";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("offering-benchmark")
@ApiTags("offering-benchmark(test only, to be deleted)")
export class EducationProgramOfferingBenchmarkController extends BaseController {
  constructor(
    private readonly formService: FormService,
    private readonly offeringBulkService: EducationProgramOfferingCreationService,
  ) {
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

  @Get("no-dry-run/:calls/max-parallel-calls/:maxParallelCalls")
  async runBenchmarkNoDryRun(
    @Param("calls") calls: number,
    @Param("maxParallelCalls") maxParallelCalls: number,
  ): Promise<any> {
    const queue: queueAsPromised<any, void> = fastq.promise(
      this.processOffering,
      maxParallelCalls,
    );

    const allPromises: Promise<void>[] = [];
    for (let i = 0; i < calls; i++) {
      // const offeringToValidate = new SaveOfferingModel();
      // offeringToValidate.offeringName = OFFERING_SAMPLE_NO_DRY_RUN.offeringName;
      // offeringToValidate.yearOfStudy = OFFERING_SAMPLE_NO_DRY_RUN.yearOfStudy;
      // offeringToValidate.showYearOfStudy =
      //   OFFERING_SAMPLE_NO_DRY_RUN.showYearOfStudy;
      // offeringToValidate.offeringIntensity =
      //   OFFERING_SAMPLE_NO_DRY_RUN.offeringIntensity;
      // offeringToValidate.offeringDelivered =
      //   OFFERING_SAMPLE_NO_DRY_RUN.offeringDelivered;
      // offeringToValidate.hasOfferingWILComponent =
      //   OFFERING_SAMPLE_NO_DRY_RUN.hasOfferingWILComponent;
      // offeringToValidate.programOfferingWILMismatch =
      //   OFFERING_SAMPLE_NO_DRY_RUN.programOfferingWILMismatch;
      // offeringToValidate.studyStartDate = new Date(
      //   OFFERING_SAMPLE_NO_DRY_RUN.studyStartDate,
      // );
      // offeringToValidate.studyEndDate = new Date(
      //   OFFERING_SAMPLE_NO_DRY_RUN.studyEndDate,
      // );
      // offeringToValidate.lacksStudyBreaks =
      //   OFFERING_SAMPLE_NO_DRY_RUN.lacksStudyBreaks;

      // offeringToValidate.studyBreaks = [];
      // const break1 = new StudyBreak();
      // break1.breakStartDate = new Date("2022-08-11");
      // break1.breakEndDate = new Date("2022-08-20");
      // offeringToValidate.studyBreaks.push(break1);
      // const break2 = new StudyBreak();
      // break2.breakStartDate = new Date("2022-08-28");
      // break2.breakEndDate = new Date("2022-09-10");
      // offeringToValidate.studyBreaks.push(break2);
      // const break3 = new StudyBreak();
      // break3.breakStartDate = new Date("2022-08-28");
      // break3.breakEndDate = new Date("2022-09-10");
      // offeringToValidate.studyBreaks.push(break3);

      // offeringToValidate.actualTuitionCosts =
      //   OFFERING_SAMPLE_NO_DRY_RUN.actualTuitionCosts;
      // offeringToValidate.programRelatedCosts =
      //   OFFERING_SAMPLE_NO_DRY_RUN.programRelatedCosts;
      // offeringToValidate.mandatoryFees =
      //   OFFERING_SAMPLE_NO_DRY_RUN.mandatoryFees;
      // offeringToValidate.exceptionalExpenses =
      //   OFFERING_SAMPLE_NO_DRY_RUN.exceptionalExpenses;
      // offeringToValidate.programIntensity =
      //   OFFERING_SAMPLE_NO_DRY_RUN.programIntensity;
      // offeringToValidate.programDeliveryTypes = new ProgramDeliveryTypes();
      // offeringToValidate.programDeliveryTypes.deliveredOnSite =
      //   OFFERING_SAMPLE_NO_DRY_RUN.programDeliveryTypes.deliveredOnSite;
      // offeringToValidate.programDeliveryTypes.deliveredOnline =
      //   OFFERING_SAMPLE_NO_DRY_RUN.programDeliveryTypes.deliveredOnline;
      // offeringToValidate.hasWILComponent =
      //   OFFERING_SAMPLE_NO_DRY_RUN.hasWILComponent;

      const promise = queue.push({
        offeringBulkService: this.offeringBulkService,
        payload: OFFERING_SAMPLE_NO_DRY_RUN,
      });

      allPromises.push(promise);
    }
    await Promise.all(allPromises);
    console.info(`Done.`);
  }

  private async processOffering(args: any): Promise<void> {
    return args.offeringBulkService.createOffering(args.payload);
  }
}
