import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
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
  BatchRestrictionAPIInDTO,
  BatchRestrictionDetailsAPIOutDTO,
  BatchRestrictionStudentAPIOutDTO,
  BatchRestrictionSummaryAPIOutDTO,
} from "./models/batch-restriction.dto";
import {
  BatchRestrictionStudentPaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";
import {
  BatchRestrictionService,
  BatchRestrictionStudentResult,
  RestrictionService,
} from "../../services";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { getUserFullName } from "../../utilities";
import { RestrictionType } from "@sims/sims-db";

/**
 * Provides AEST endpoints for submitting and reviewing batch restrictions.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Roles(Role.AESTBatchRestriction)
@Controller("batch-restriction")
@ApiTags(`${ClientTypeBaseRoute.AEST}-batch-restriction`)
export class BatchRestrictionAESTController extends BaseController {
  constructor(
    private readonly batchRestrictionService: BatchRestrictionService,
    private readonly restrictionService: RestrictionService,
  ) {
    super();
  }

  /**
   * Adds a provincial restriction to the students of the given application numbers.
   * The same note is applied to all restrictions added through the batch.
   * @param payload restriction, application numbers, and note for the batch.
   * @param userToken authenticated AEST user token.
   * @returns the primary identifier of the created batch.
   */
  @ApiUnprocessableEntityResponse({
    description:
      "The given restriction type is not Provincial. Only provincial restrictions can be added.",
  })
  @Post()
  async createBatchRestriction(
    @Body() payload: BatchRestrictionAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const restrictionExists = await this.restrictionService.restrictionExists(
      payload.restrictionId,
      RestrictionType.Provincial,
    );
    if (!restrictionExists) {
      throw new UnprocessableEntityException(
        "The given restriction type is not Provincial. Only provincial restrictions can be added.",
      );
    }
    const batchRestriction =
      await this.batchRestrictionService.createBatchRestriction(
        payload.restrictionId,
        payload.applicationNumbers,
        payload.note,
        userToken.userId,
      );
    return { id: batchRestriction.id };
  }

  /**
   * Gets the batch restriction submissions.
   * @returns batch restriction submissions.
   */
  @Get()
  async getBatchRestrictions(): Promise<BatchRestrictionSummaryAPIOutDTO[]> {
    const summaries =
      await this.batchRestrictionService.getBatchRestrictionSummaries();
    return summaries.map((summary) => ({
      id: summary.id,
      batchNumber: summary.batchNumber,
      createdAt: summary.createdAt,
      creatorName: getUserFullName({
        firstName: summary.creatorFirstName,
        lastName: summary.creatorLastName,
      }),
      restrictionCode: summary.restrictionCode,
      restrictionDescription: summary.restrictionDescription,
      totalCount: summary.totalCount,
      successCount: summary.successCount,
      failureCount: summary.failureCount,
    }));
  }

  /**
   * Gets the details of a batch restriction submission.
   * @param batchRestrictionId batch restriction ID.
   * @returns batch restriction details.
   */
  @Get(":batchRestrictionId")
  @ApiNotFoundResponse({ description: "Batch restriction not found." })
  async getBatchRestriction(
    @Param("batchRestrictionId", ParseIntPipe) batchRestrictionId: number,
  ): Promise<BatchRestrictionDetailsAPIOutDTO> {
    const batchRestriction =
      await this.batchRestrictionService.getBatchRestrictionDetails(
        batchRestrictionId,
      );
    if (!batchRestriction) {
      throw new NotFoundException(
        `Batch restriction with ID ${batchRestrictionId} not found.`,
      );
    }
    return {
      id: batchRestriction.id,
      batchNumber: batchRestriction.batchNumber,
      restrictionCode: batchRestriction.restriction.restrictionCode,
      restrictionDescription: batchRestriction.restriction.description,
    };
  }

  /**
   * Gets the restriction outcome of all students in a batch restriction.
   * @param batchRestrictionId batch restriction ID.
   * @param paginationOptions pagination options, with optional application number
   * search criteria and result filter.
   * @returns paginated student outcomes.
   */
  @Get(":batchRestrictionId/students")
  @ApiNotFoundResponse({ description: "Batch restriction not found." })
  async getBatchRestrictionStudents(
    @Param("batchRestrictionId", ParseIntPipe) batchRestrictionId: number,
    @Query()
    paginationOptions: BatchRestrictionStudentPaginationOptionsAPIInDTO,
  ): Promise<PaginatedResultsAPIOutDTO<BatchRestrictionStudentAPIOutDTO>> {
    const batchRestrictionExists =
      await this.batchRestrictionService.batchRestrictionExists(
        batchRestrictionId,
      );
    if (!batchRestrictionExists) {
      throw new NotFoundException(
        `Batch restriction with ID ${batchRestrictionId} not found.`,
      );
    }
    const students =
      await this.batchRestrictionService.getBatchRestrictionStudents(
        batchRestrictionId,
        paginationOptions,
      );
    return {
      results: students.results.map((student) => ({
        applicationNumber: student.applicationNumber,
        studentId: student.studentRestriction?.student.id,
        result: student.failureReason
          ? BatchRestrictionStudentResult.Failed
          : BatchRestrictionStudentResult.Successful,
        failureReason: student.failureReason,
      })),
      count: students.count,
    };
  }
}
