import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  UnprocessableEntityException,
  NotFoundException,
  InternalServerErrorException,
  ParseIntPipe,
  Query,
  BadRequestException,
} from "@nestjs/common";
import {
  StudentRestrictionService,
  InstitutionRestrictionService,
  RestrictionService,
  InstitutionService,
} from "../../services";
import BaseController from "../BaseController";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import { IUserToken } from "../../auth/userToken.interface";
import {
  RestrictionSummaryAPIOutDTO,
  RestrictionDetailAPIOutDTO,
  ResolveRestrictionAPIInDTO,
  AssignRestrictionAPIInDTO,
  RestrictionStatusAPIOutDTO,
  DeleteRestrictionAPIInDTO,
  RestrictionReasonsOptionsAPIInDTO,
  AssignInstitutionRestrictionAPIInDTO,
  InstitutionRestrictionSummaryAPIOutDTO,
  InstitutionActiveRestrictionsAPIOutDTO,
  RestrictionAPIOutDTO,
  BatchStudentRestrictionsAPIInDTO,
  BatchStudentRestrictionsSummaryAPIOutDTO,
} from "./models/restriction.dto";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import { getUserFullName } from "../../utilities";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { Role } from "../../auth/roles.enum";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import {
  PrimaryIdentifierAPIOutDTO,
  PrimaryIdentifiersAPIOutDTO,
} from "../models/primary.identifier.dto";
import { RestrictionControllerService } from "./restriction.controller.service";
import { CustomNamedError } from "@sims/utilities";
import {
  RESTRICTION_NOT_FOUND,
  RESTRICTION_NOT_ACTIVE,
  RESTRICTION_IS_DELETED,
  INSTITUTION_NOT_FOUND,
  INSTITUTION_RESTRICTION_ALREADY_ACTIVE,
  RESTRICTION_NOT_PROVINCIAL,
  FIELD_REQUIREMENTS_NOT_VALID,
} from "../../constants";
import { RestrictionType } from "@sims/sims-db";

// Stubbed data used until the batch student restrictions persistence is available.
// Replace the stubs with the batch student restrictions service calls.
const STUB_BATCH_STUDENT_RESTRICTIONS: BatchStudentRestrictionsSummaryAPIOutDTO[] =
  [
    {
      id: 2,
      batchNumber: 2,
      createdAt: new Date("2026-10-29T14:32:00"),
      creatorName: "Ministry User",
      restrictionCode: "B6A",
      restrictionDescription: "Student overawarded",
      totalCount: 1250,
      successCount: 1248,
      failureCount: 2,
    },
    {
      id: 1,
      batchNumber: 1,
      createdAt: new Date("2026-10-28T09:15:00"),
      creatorName: "Ministry User",
      restrictionCode: "SSR",
      restrictionDescription: "Suspended student restriction",
      totalCount: 3,
      successCount: 3,
      failureCount: 0,
    },
  ];

/**
 * Controller for AEST Restrictions.
 * This consists of all Rest APIs for AEST restrictions.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("restriction")
@ApiTags(`${ClientTypeBaseRoute.AEST}-restriction`)
export class RestrictionAESTController extends BaseController {
  constructor(
    private readonly restrictionControllerService: RestrictionControllerService,
    private readonly studentRestrictionService: StudentRestrictionService,
    private readonly restrictionService: RestrictionService,
    private readonly institutionRestrictionService: InstitutionRestrictionService,
    private readonly institutionService: InstitutionService,
  ) {
    super();
  }

  // The batch student restrictions routes must be declared before the
  // student/:studentId routes, otherwise "batch" is captured as a student ID.

  /**
   * Adds a provincial restriction to the students of the given application numbers.
   * The same note is applied to all restrictions added through the batch.
   * @param payload restriction, application numbers, and note for the batch.
   * @returns the primary identifier of the created batch.
   */
  @Roles(Role.AESTBatchStudentRestrictions)
  @ApiUnprocessableEntityResponse({
    description:
      "The given restriction type is not Provincial. Only provincial restrictions can be added.",
  })
  @Post("student/batch")
  async createBatchStudentRestrictions(
    @Body() payload: BatchStudentRestrictionsAPIInDTO,
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
    const uniqueApplicationNumbers = new Set(payload.applicationNumbers);
    const nextId = STUB_BATCH_STUDENT_RESTRICTIONS.length + 1;
    STUB_BATCH_STUDENT_RESTRICTIONS.unshift({
      id: nextId,
      batchNumber: nextId,
      createdAt: new Date(),
      creatorName: "Ministry User",
      restrictionCode: "STUB",
      restrictionDescription: `Restriction ${payload.restrictionId}`,
      totalCount: uniqueApplicationNumbers.size,
      successCount: uniqueApplicationNumbers.size,
      failureCount: 0,
    });
    return { id: nextId };
  }

  /**
   * Gets the batch student restriction submissions.
   * @returns batch student restriction submissions.
   */
  @Roles(Role.AESTBatchStudentRestrictions)
  @Get("student/batch")
  getBatchStudentRestrictions(): BatchStudentRestrictionsSummaryAPIOutDTO[] {
    return STUB_BATCH_STUDENT_RESTRICTIONS.map((summary) => ({
      id: summary.id,
      batchNumber: summary.batchNumber,
      createdAt: summary.createdAt,
      creatorName: summary.creatorName,
      restrictionCode: summary.restrictionCode,
      restrictionDescription: summary.restrictionDescription,
      totalCount: summary.totalCount,
      successCount: summary.successCount,
      failureCount: summary.failureCount,
    }));
  }

  /**
   * Get restrictions for a student.
   * @param studentId id of the student to retrieve restrictions.
   * @returns Student restrictions.
   */
  @Get("student/:studentId")
  async getStudentRestrictions(
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<RestrictionSummaryAPIOutDTO[]> {
    return this.restrictionControllerService.getStudentRestrictions(studentId, {
      extendedDetails: true,
    });
  }

  /**
   * Provide the list of restriction categories for drop-down.
   * @returns Categories option list.
   */
  @Get("categories/options-list")
  async getCategoriesOptionsList(): Promise<OptionItemAPIOutDTO[]> {
    const categories =
      await this.restrictionService.getAllRestrictionCategories();
    return categories.map((category) => ({
      id: category.id,
      description: category.restrictionCategory,
    }));
  }

  /**
   * Provide the list of restriction reasons for selected category.
   * @param restrictionCategory Selected category from category list.
   * @returns Reasons option list.
   */
  @Get("reasons")
  async getReasonsOptionsList(
    @Query() options: RestrictionReasonsOptionsAPIInDTO,
  ): Promise<RestrictionAPIOutDTO[]> {
    const reasons =
      await this.restrictionService.getRestrictionReasonsByCategory(
        options.type,
        options.category,
      );
    return reasons.map((reason) => ({
      id: reason.id,
      description: `${reason.restrictionCode} - ${reason.description}`,
      fieldRequirements: reason.metadata?.fieldRequirements,
    }));
  }

  /**
   * Get the details for view student restriction.
   * @param studentId id of the student.
   * @param studentRestrictionId id of the student restriction.
   * @returns Student restriction detail view.
   */
  @ApiNotFoundResponse({
    description: "The student restriction does not exist.",
  })
  @Get("student/:studentId/student-restriction/:studentRestrictionId")
  async getStudentRestrictionDetail(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Param("studentRestrictionId", ParseIntPipe) studentRestrictionId: number,
  ): Promise<RestrictionDetailAPIOutDTO> {
    return this.restrictionControllerService.getStudentRestrictionDetail(
      studentId,
      studentRestrictionId,
      {
        extendedDetails: true,
      },
    );
  }

  /**
   * Add a new provincial restriction to Student.
   * * Note: Federal restrictions are added/resolved by nightly job not through this API.
   * @param studentId id of the student to get a restriction.
   * @param payload restriction details.
   */
  @Roles(Role.StudentAddRestriction)
  @ApiUnprocessableEntityResponse({
    description:
      "The given restriction type is not Provincial. Only provincial restrictions can be added.",
  })
  @Post("student/:studentId")
  async addStudentProvincialRestriction(
    @UserToken() userToken: IUserToken,
    @Param("studentId", ParseIntPipe) studentId: number,
    @Body() payload: AssignRestrictionAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const restriction = await this.restrictionService.restrictionExists(
      payload.restrictionId,
      RestrictionType.Provincial,
    );
    if (!restriction) {
      throw new UnprocessableEntityException(
        "The given restriction type is not Provincial. Only provincial restrictions can be added.",
      );
    }
    const newStudentRestriction =
      await this.studentRestrictionService.addProvincialRestriction(
        studentId,
        userToken.userId,
        payload.restrictionId,
        payload.noteDescription,
      );
    return { id: newStudentRestriction.id };
  }

  /**
   * Resolve a provincial restriction.
   * * Note: Federal restrictions are added/resolved by nightly job not through this API.
   * @param studentId id of the student.
   * @param studentRestrictionId id of the student restriction.
   * @param payload restriction details.
   */
  @Roles(Role.StudentResolveRestriction)
  @ApiUnprocessableEntityResponse({
    description:
      "Resolution Notes are mandatory to resolve the restriction." +
      "The restriction neither assigned to student nor active. Only active restrictions can be resolved." +
      "The given restriction type is not Provincial. Only provincial restrictions can be resolved by application user.",
  })
  @Patch("student/:studentId/studentRestriction/:studentRestrictionId/resolve")
  async resolveStudentProvincialRestriction(
    @UserToken() userToken: IUserToken,
    @Param("studentId", ParseIntPipe) studentId: number,
    @Param("studentRestrictionId", ParseIntPipe) studentRestrictionId: number,
    @Body() payload: ResolveRestrictionAPIInDTO,
  ): Promise<void> {
    try {
      await this.studentRestrictionService.resolveProvincialRestriction(
        studentId,
        studentRestrictionId,
        userToken.userId,
        payload.noteDescription,
      );
    } catch (error) {
      if (
        error.name === RESTRICTION_NOT_ACTIVE ||
        error.name === RESTRICTION_NOT_PROVINCIAL
      ) {
        throw new UnprocessableEntityException(error.message);
      }
      throw new InternalServerErrorException(
        "Unexpected error while resolving restriction",
      );
    }
  }

  /**
   * Soft deletes a provincial restriction from Student.
   * @param studentId ID of the student to get a restriction.
   * @param studentRestrictionId ID of the student restriction to be deleted.
   * @param payload delete restriction details.
   */
  @Roles(Role.StudentDeleteRestriction)
  @ApiNotFoundResponse({
    description: "Provincial restriction not found.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Provincial restriction is already set as deleted or " +
      "failed to delete the restriction: an unexpected associated application restriction bypass was already removed.",
  })
  @Patch("student/:studentId/student-restriction/:studentRestrictionId/delete")
  async deleteStudentProvincialRestriction(
    @UserToken() userToken: IUserToken,
    @Param("studentId", ParseIntPipe) studentId: number,
    @Param("studentRestrictionId", ParseIntPipe) studentRestrictionId: number,
    @Body() payload: DeleteRestrictionAPIInDTO,
  ): Promise<void> {
    try {
      await this.studentRestrictionService.deleteProvincialRestriction(
        studentId,
        studentRestrictionId,
        userToken.userId,
        payload.noteDescription,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case RESTRICTION_NOT_FOUND:
            throw new NotFoundException(error.message);
          case RESTRICTION_IS_DELETED:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
        }
      }
      throw error;
    }
  }

  /**
   * Get restrictions for an institution.
   * @param institutionId ID of the institution to retrieve its restrictions.
   * @returns Institution restrictions.
   */
  @Get("institution/:institutionId")
  async getInstitutionRestrictions(
    @Param("institutionId", ParseIntPipe) institutionId: number,
  ): Promise<InstitutionRestrictionSummaryAPIOutDTO[]> {
    const institutionRestrictions =
      await this.institutionRestrictionService.getInstitutionRestrictions(
        institutionId,
      );
    return institutionRestrictions.map((institutionRestriction) => ({
      restrictionId: institutionRestriction.id,
      restrictionType: institutionRestriction.restriction.restrictionType,
      restrictionCategory:
        institutionRestriction.restriction.restrictionCategory,
      restrictionCode: institutionRestriction.restriction.restrictionCode,
      description: institutionRestriction.restriction.description,
      createdAt: institutionRestriction.createdAt,
      locationName: institutionRestriction.location?.name,
      programName: institutionRestriction.program?.name,
      resolvedAt: institutionRestriction.resolvedAt,
      isActive: institutionRestriction.isActive,
    }));
  }

  /**
   * Get active institution restrictions.
   * @param institutionId institution id.
   * @returns active institution restrictions.
   */
  @ApiNotFoundResponse({
    description: "Institution not found.",
  })
  @Get("institution/:institutionId/active")
  async getActiveInstitutionRestrictions(
    @Param("institutionId", ParseIntPipe) institutionId: number,
  ): Promise<InstitutionActiveRestrictionsAPIOutDTO> {
    const institutionExists =
      await this.institutionService.institutionExists(institutionId);
    if (!institutionExists) {
      throw new NotFoundException("Institution not found.");
    }
    return this.restrictionControllerService.getActiveInstitutionRestrictions(
      institutionId,
      "ministryBanner",
    );
  }

  /**
   * Get the details for view institution restriction.
   * @param institutionId institution id to retrieve restriction.
   * @param institutionRestrictionId id of the institution restriction to be retrieved.
   * @returns Institution restriction detail view.
   */
  @ApiNotFoundResponse({
    description: "The institution restriction does not exist.",
  })
  @Get(
    "institution/:institutionId/institutionRestriction/:institutionRestrictionId",
  )
  async getInstitutionRestrictionDetail(
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Param("institutionRestrictionId", ParseIntPipe)
    institutionRestrictionId: number,
  ): Promise<RestrictionDetailAPIOutDTO> {
    const institutionRestriction =
      await this.institutionRestrictionService.getInstitutionRestrictionDetailsById(
        institutionId,
        institutionRestrictionId,
      );
    if (!institutionRestriction) {
      throw new NotFoundException(
        "The institution restriction does not exist.",
      );
    }
    return {
      restrictionId: institutionRestriction.id,
      restrictionType: institutionRestriction.restriction.restrictionType,
      restrictionCategory:
        institutionRestriction.restriction.restrictionCategory,
      restrictionCode: institutionRestriction.restriction.restrictionCode,
      description: institutionRestriction.restriction.description,
      createdAt: institutionRestriction.createdAt,
      // Currently mapping resolvedAt to updatedAt as there is no resolvedAt for
      // institutions restrictions but the API shares the same DTO.
      resolvedAt: institutionRestriction.updatedAt,
      createdBy: getUserFullName(institutionRestriction.creator),
      // Currently mapping modifier to resolvedBy as there is no resolvedBy for
      // institutions restrictions but the API shares the same DTO.
      resolvedBy: getUserFullName(institutionRestriction.modifier),
      isActive: institutionRestriction.isActive,
      restrictionNote: institutionRestriction.restrictionNote?.description,
      resolutionNote: institutionRestriction.resolutionNote?.description,
    };
  }

  /**
   * Add a new restriction to an Institution.
   * @param institutionId ID of the institution to add a restriction.
   * @param payload Restriction details.
   * @returns Identifier of the created institution restriction.
   */
  @Roles(Role.InstitutionAddRestriction)
  @ApiNotFoundResponse({
    description: "Institution not found.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Institution restriction ID not found or " +
      "the specified location or program does not belong to the institution or " +
      "an active restriction already exists for the institution.",
  })
  @Post("institution/:institutionId")
  async addInstitutionRestriction(
    @UserToken() userToken: IUserToken,
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Body() payload: AssignInstitutionRestrictionAPIInDTO,
  ): Promise<PrimaryIdentifiersAPIOutDTO> {
    try {
      const createdRestrictions =
        await this.institutionRestrictionService.addInstitutionRestriction(
          institutionId,
          payload,
          userToken.userId,
        );
      return { ids: createdRestrictions.map((r) => r.id) };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case INSTITUTION_NOT_FOUND:
            throw new NotFoundException(error.message);
          case FIELD_REQUIREMENTS_NOT_VALID:
            throw new BadRequestException(error.message);
          case INSTITUTION_RESTRICTION_ALREADY_ACTIVE:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
          default:
            throw new UnprocessableEntityException(error.message);
        }
      }
      throw error;
    }
  }

  /**
   * Resolve a provincial restriction for Institution.
   * @param institutionId id of the institution.
   * @param institutionRestrictionId id of the institution restriction to be resolved.
   * @param payload institution restriction details.
   */
  @Roles(Role.InstitutionResolveRestriction)
  @ApiUnprocessableEntityResponse({
    description: "The restriction is already resolved.",
  })
  @ApiNotFoundResponse({
    description: "The restriction is not assigned to the institution.",
  })
  @Patch(
    "institution/:institutionId/institutionRestriction/:institutionRestrictionId/resolve",
  )
  async resolveInstitutionRestriction(
    @UserToken() userToken: IUserToken,
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Param("institutionRestrictionId", ParseIntPipe)
    institutionRestrictionId: number,
    @Body() payload: ResolveRestrictionAPIInDTO,
  ): Promise<void> {
    try {
      await this.institutionRestrictionService.resolveInstitutionRestriction(
        institutionId,
        institutionRestrictionId,
        userToken.userId,
        payload.noteDescription,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case RESTRICTION_NOT_FOUND:
            throw new NotFoundException(error.message);
          case RESTRICTION_NOT_ACTIVE:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
        }
      }
      throw error;
    }
  }

  /**
   * Get restriction status for an institution.
   * @param institutionId id of the institution.
   * @returns Institution restriction status.
   */
  @Get("institution/:institutionId/status")
  async getRestrictionStatusById(
    @Param("institutionId", ParseIntPipe) institutionId: number,
  ): Promise<RestrictionStatusAPIOutDTO> {
    const institutionRestrictions =
      await this.institutionRestrictionService.getRestrictionStatusById(
        institutionId,
      );
    return {
      isActive: !!institutionRestrictions?.length,
    };
  }
}
