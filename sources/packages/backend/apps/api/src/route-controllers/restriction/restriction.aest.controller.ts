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
  Delete,
} from "@nestjs/common";
import {
  StudentRestrictionService,
  InstitutionRestrictionService,
  RestrictionService,
  InstitutionService,
  RESTRICTION_NOT_ACTIVE,
  RESTRICTION_NOT_PROVINCIAL,
  RESTRICTION_NOT_FOUND,
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
  RestrictionCategoryParamAPIInDTO,
  DeleteRestrictionAPIInDTO,
} from "./models/restriction.dto";
import { ClientTypeBaseRoute } from "../../types";
import { getUserFullName } from "../../utilities";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { Role } from "../../auth/roles.enum";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { RestrictionControllerService } from "./restriction.controller.service";
import { CustomNamedError } from "@sims/utilities";

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
  @Get("category/:restrictionCategory/reasons")
  async getReasonsOptionsList(
    @Param() restrictionCategoryParam: RestrictionCategoryParamAPIInDTO,
  ): Promise<OptionItemAPIOutDTO[]> {
    const reasons =
      await this.restrictionService.getRestrictionReasonsByCategory(
        restrictionCategoryParam.restrictionCategory,
      );
    return reasons.map((reason) => ({
      id: reason.id,
      description: `${reason.restrictionCode} - ${reason.description}`,
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
    const restriction =
      await this.restrictionService.getProvincialRestrictionById(
        payload.restrictionId,
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
    description: "Provincial restriction not found to be deleted.",
  })
  @Delete("student/:studentId/student-restriction/:studentRestrictionId")
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
        if (error.name === RESTRICTION_NOT_FOUND) {
          throw new NotFoundException(error.message);
        }
      }
      throw error;
    }
  }

  /**
   * Get restrictions for an institution.
   * @param institutionId id of the institution to retrieve its restrictions.
   * @returns Institution Restrictions.
   */
  @Get("institution/:institutionId")
  async getInstitutionRestrictions(
    @Param("institutionId", ParseIntPipe) institutionId: number,
  ): Promise<RestrictionSummaryAPIOutDTO[]> {
    const institutionRestrictions =
      await this.institutionRestrictionService.getInstitutionRestrictionsById(
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
      updatedAt: institutionRestriction.updatedAt,
      isActive: institutionRestriction.isActive,
    }));
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
      updatedAt: institutionRestriction.updatedAt,
      createdBy: getUserFullName(institutionRestriction.creator),
      updatedBy: getUserFullName(institutionRestriction.modifier),
      isActive: institutionRestriction.isActive,
      restrictionNote: institutionRestriction.restrictionNote?.description,
      resolutionNote: institutionRestriction.resolutionNote?.description,
    };
  }

  /**
   * Add a new provincial restriction to Institution.
   * * Note: Only provincial restriction of category Designation can be added to institution.
   * @param institutionId id of the institution to get a restriction.
   * @param payload restriction details.
   */
  @Roles(Role.InstitutionAddRestriction)
  @ApiUnprocessableEntityResponse({
    description:
      "The given restriction type is either not Provincial or not Institution.",
  })
  @Post("institution/:institutionId")
  async addInstitutionProvincialRestriction(
    @UserToken() userToken: IUserToken,
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Body() payload: AssignRestrictionAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const restriction =
      await this.restrictionService.getProvincialRestrictionById(
        payload.restrictionId,
        true,
      );
    if (!restriction) {
      throw new UnprocessableEntityException(
        "The given restriction type is either not Provincial or not Institution.",
      );
    }
    // TODO:Modify this method to add restriction and note in a transaction.
    const updatedRestriction =
      await this.institutionRestrictionService.addProvincialRestriction(
        institutionId,
        userToken.userId,
        payload.restrictionId,
        payload.noteDescription,
      );
    // Mapping the note added for restriction to institution notes
    if (updatedRestriction.restrictionNote) {
      await this.institutionService.saveInstitutionNote(
        institutionId,
        updatedRestriction.restrictionNote,
      );
    }
    return { id: updatedRestriction.id };
  }

  /**
   * Resolve a provincial restriction for Institution.
   * @param institutionId id of the institution.
   * @param institutionRestrictionId id of the institution restriction to be resolved.
   * @param payload institution restriction details.
   */
  @Roles(Role.InstitutionResolveRestriction)
  @ApiUnprocessableEntityResponse({
    description:
      "Resolution Notes are mandatory to resolve the restriction." +
      "The restriction neither assigned to student nor active. Only active restrictions can be resolved.",
  })
  @Patch(
    "institution/:institutionId/institutionRestriction/:institutionRestrictionId/resolve",
  )
  async resolveInstitutionProvincialRestriction(
    @UserToken() userToken: IUserToken,
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Param("institutionRestrictionId", ParseIntPipe)
    institutionRestrictionId: number,
    @Body() payload: ResolveRestrictionAPIInDTO,
  ): Promise<void> {
    if (!payload.noteDescription) {
      throw new UnprocessableEntityException(
        "Resolution Notes are mandatory to resolve the restriction.",
      );
    }
    try {
      const updatedRestriction =
        await this.institutionRestrictionService.resolveProvincialRestriction(
          institutionId,
          institutionRestrictionId,
          userToken.userId,
          payload.noteDescription,
        );

      /**mapping the note added for resolution to student notes**/
      await this.institutionService.saveInstitutionNote(
        institutionId,
        updatedRestriction.resolutionNote,
      );
    } catch (error) {
      if (error.name === RESTRICTION_NOT_ACTIVE) {
        throw new UnprocessableEntityException(error.message);
      }
      throw new InternalServerErrorException(
        "Unexpected error while resolving restriction",
      );
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
