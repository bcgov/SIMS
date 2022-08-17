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
} from "@nestjs/common";
import {
  StudentRestrictionService,
  InstitutionRestrictionService,
  RestrictionService,
  StudentService,
  InstitutionService,
  RESTRICTION_NOT_ACTIVE,
  RESTRICTION_NOT_PROVINCIAL,
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
    private readonly studentRestrictionService: StudentRestrictionService,
    private readonly restrictionService: RestrictionService,
    private readonly studentService: StudentService,
    private readonly institutionRestrictionService: InstitutionRestrictionService,
    private readonly institutionService: InstitutionService,
  ) {
    super();
  }

  /**
   * Get restrictions for a student.
   * @param studentId
   * @returns Student Restrictions.
   */
  @Get("student/:studentId")
  async getStudentRestrictions(
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<RestrictionSummaryAPIOutDTO[]> {
    const studentRestrictions =
      await this.studentRestrictionService.getStudentRestrictionsById(
        studentId,
      );
    return studentRestrictions?.map((studentRestriction) => ({
      restrictionId: studentRestriction.id,
      restrictionType: studentRestriction.restriction.restrictionType,
      restrictionCategory: studentRestriction.restriction.restrictionCategory,
      restrictionCode: studentRestriction.restriction.restrictionCode,
      description: studentRestriction.restriction.description,
      createdAt: studentRestriction.createdAt,
      updatedAt: studentRestriction.updatedAt,
      isActive: studentRestriction.isActive,
    }));
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
   * @param restrictionCategory Selected Category from category list.
   * @returns Reasons option list.
   */
  @Get("category/:restrictionCategory/reasons")
  async getReasonsOptionsList(
    @Param("restrictionCategory") restrictionCategory: string,
  ): Promise<OptionItemAPIOutDTO[]> {
    const reasons =
      await this.restrictionService.getRestrictionReasonsByCategory(
        restrictionCategory,
      );
    return reasons.map((reason) => ({
      id: reason.id,
      description: `${reason.restrictionCode} - ${reason.description}`,
    }));
  }

  /**
   * Get the details for view student restriction.
   * @param studentId
   * @param studentRestrictionId
   * @returns Student restriction detail view.
   */
  @ApiNotFoundResponse({
    description: "The student restriction does not exist.",
  })
  @Get("student/:studentId/studentRestriction/:studentRestrictionId")
  async getStudentRestrictionDetail(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Param("studentRestrictionId", ParseIntPipe) studentRestrictionId: number,
  ): Promise<RestrictionDetailAPIOutDTO> {
    const studentRestriction =
      await this.studentRestrictionService.getStudentRestrictionDetailsById(
        studentId,
        studentRestrictionId,
      );
    if (!studentRestriction) {
      throw new NotFoundException("The student restriction does not exist.");
    }
    return {
      restrictionId: studentRestriction.id,
      restrictionType: studentRestriction.restriction.restrictionType,
      restrictionCategory: studentRestriction.restriction.restrictionCategory,
      restrictionCode: studentRestriction.restriction.restrictionCode,
      description: studentRestriction.restriction.description,
      createdAt: studentRestriction.createdAt,
      updatedAt: studentRestriction.updatedAt,
      createdBy: getUserFullName(studentRestriction.creator),
      updatedBy: getUserFullName(studentRestriction.modifier),
      isActive: studentRestriction.isActive,
      restrictionNote: studentRestriction.restrictionNote?.description,
      resolutionNote: studentRestriction.resolutionNote?.description,
    };
  }

  /**
   * Add a new provincial restriction to Student.
   * * Note: Federal restrictions are added/resolved by nightly job not through this API.
   * @param studentId
   * @param payload
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
    // TODO Use transaction to save the restriction and save student note alongside.
    const updatedRestriction =
      await this.studentRestrictionService.addProvincialRestriction(
        studentId,
        userToken.userId,
        payload,
      );
    let institutionNote;
    /**mapping the note added for restriction to student notes**/
    if (updatedRestriction.restrictionNote) {
      institutionNote = await this.studentService.saveStudentNote(
        studentId,
        updatedRestriction.restrictionNote,
      );
    }
    return { id: institutionNote.id };
  }

  /**
   * Resolve a provincial restriction.
   * * Note: Federal restrictions are added/resolved by nightly job not through this API.
   * @param studentId
   * @param studentRestrictionId
   * @param payload
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
      // TODO Use transaction to update the restriction and save student note alongside.
      const updatedRestriction =
        await this.studentRestrictionService.resolveProvincialRestriction(
          studentId,
          studentRestrictionId,
          userToken.userId,
          payload,
        );

      /**mapping the note added for resolution to student notes**/
      await this.studentService.saveStudentNote(
        studentId,
        updatedRestriction.resolutionNote,
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
   * Get restrictions for an institution.
   * @param institutionId
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
   * @param institutionId
   * @param institutionRestrictionId
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
   * @param institutionId
   * @param payload
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
    const updatedRestriction =
      await this.institutionRestrictionService.addProvincialRestriction(
        institutionId,
        userToken.userId,
        payload.restrictionId,
        payload.noteDescription,
      );
    let institutionNote;
    // Mapping the note added for restriction to institution notes
    if (updatedRestriction.restrictionNote) {
      institutionNote = await this.institutionService.saveInstitutionNote(
        institutionId,
        updatedRestriction.restrictionNote,
      );
    }
    return { id: institutionNote.id };
  }

  /**
   * Resolve a provincial restriction for Institution.
   * @param institutionId
   * @param institutionRestrictionId
   * @param payload
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
   * @param institutionId
   * @returns Institution Restriction.
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
