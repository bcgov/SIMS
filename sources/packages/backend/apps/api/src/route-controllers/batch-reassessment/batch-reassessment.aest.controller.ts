import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { IUserToken, Role } from "../../auth";
import { UserGroups } from "../../auth/user-groups.enum";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import {
  BatchReassessmentAPIInDTO,
  BatchReassessmentApplicationAPIOutDTO,
  BatchReassessmentSummaryAPIOutDTO,
} from "./models/batch-reassessment.dto";
import { BatchReassessmentService } from "../../services";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { getUserFullName } from "../../utilities";
import {
  BatchReassessmentApplicationsPaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";

/**
 * Provides AEST endpoints for submitting and reviewing batch manual reassessments.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Roles(Role.AESTBatchReassessment)
@Controller("batch-reassessment")
@ApiTags(`${ClientTypeBaseRoute.AEST}-batch-reassessment`)
export class BatchReassessmentAESTController extends BaseController {
  constructor(
    private readonly batchReassessmentService: BatchReassessmentService,
  ) {
    super();
  }

  /**
   * Triggers a batch manual reassessment for a list of application numbers.
   * Multiple invocations are prevented from running concurrently via the sequence control mechanism.
   * @param payload batch reassessment request payload.
   * @param userToken authenticated AEST user token.
   * @returns the primary identifier of the created batch reassessment.
   */
  @Post()
  async createBatchReassessment(
    @Body() payload: BatchReassessmentAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const batchReassessment =
      await this.batchReassessmentService.createBatchReassessment(
        payload.applicationNumbers,
        payload.note,
        userToken.userId,
      );
    return { id: batchReassessment.id };
  }

  /**
   * Gets batch manual reassessment submissions.
   * @returns batch manual reassessment submissions.
   */
  @Get()
  async getBatchReassessments(): Promise<BatchReassessmentSummaryAPIOutDTO[]> {
    const summaries =
      await this.batchReassessmentService.getBatchReassessmentSummaries();
    return summaries.map((summary) => ({
      id: summary.id,
      batchNumber: summary.batchNumber,
      createdAt: summary.createdAt,
      creatorName: getUserFullName({
        firstName: summary.creatorFirstName,
        lastName: summary.creatorLastName,
      }),
      totalCount: summary.totalCount,
      successCount: summary.successCount,
      failureCount: summary.failureCount,
      pendingCount: summary.pendingCount,
      status: summary.status,
    }));
  }

  /**
   * Gets the reassessment outcome of each application in a batch manual reassessment.
   * @param batchReassessmentId batch manual reassessment ID.
   * @param paginationOptions pagination options, with optional application number
   * search criteria and result filter.
   * @returns paginated application outcomes.
   */
  @Get(":batchReassessmentId/applications")
  @ApiNotFoundResponse({ description: "Batch reassessment not found." })
  async getBatchReassessmentApplications(
    @Param("batchReassessmentId", ParseIntPipe) batchReassessmentId: number,
    @Query()
    paginationOptions: BatchReassessmentApplicationsPaginationOptionsAPIInDTO,
  ): Promise<PaginatedResultsAPIOutDTO<BatchReassessmentApplicationAPIOutDTO>> {
    const batchReassessmentExists =
      await this.batchReassessmentService.batchReassessmentExists(
        batchReassessmentId,
      );
    if (!batchReassessmentExists) {
      throw new NotFoundException(
        `Batch reassessment with ID ${batchReassessmentId} not found.`,
      );
    }
    return this.batchReassessmentService.getBatchReassessmentApplications(
      batchReassessmentId,
      paginationOptions,
    );
  }
}
