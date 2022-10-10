import { Controller } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe";
import {
  ZeebeJob,
  MustReturnJobActionAcknowledgement,
  IOutputVariables,
  ICustomHeaders,
} from "zeebe-node";
import { CRAIncomeVerificationService } from "../../services";
import {
  CheckIncomeRequestJobInDTO,
  CheckIncomeRequestJobOutDTO,
  CreateIncomeRequestJobInDTO,
  CreateIncomeRequestJobOutDTO,
} from "..";
import { APPLICATION_ID, SUPPORTING_USER_ID } from "../workflow-constants";

@Controller()
export class CRAIntegrationController {
  constructor(
    private readonly incomeVerificationService: CRAIncomeVerificationService,
  ) {}

  @ZeebeWorker("create-income-request", {
    fetchVariable: [
      APPLICATION_ID,
      SUPPORTING_USER_ID,
      "taxYear",
      "reportedIncome",
      "supportingUserId",
    ],
  })
  async createSupportingUsers(
    job: Readonly<
      ZeebeJob<
        CreateIncomeRequestJobInDTO,
        IOutputVariables,
        CreateIncomeRequestJobOutDTO
      >
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    const incomeRequest =
      await this.incomeVerificationService.createIncomeVerification(
        job.variables.applicationId,
        job.variables.taxYear,
        job.variables.reportedIncome,
        job.variables.supportingUserId,
      );
    const [identifier] = incomeRequest.identifiers;
    return job.complete({ incomeVerificationId: identifier.id });
  }

  @ZeebeWorker("check-income-request", {
    fetchVariable: ["incomeVerificationId"],
  })
  async checkSupportingUserResponse(
    job: Readonly<
      ZeebeJob<
        CheckIncomeRequestJobInDTO,
        ICustomHeaders,
        CheckIncomeRequestJobOutDTO
      >
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    const incomeVerificationCompleted =
      await this.incomeVerificationService.isIncomeVerificationCompleted(
        job.variables.incomeVerificationId,
      );
    return job.complete({ incomeVerificationCompleted });
  }
}
