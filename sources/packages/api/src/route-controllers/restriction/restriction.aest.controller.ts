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
import { getIDIRUserFullName } from "../../utilities";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { Role } from "../../auth/roles.enum";
import { OptionItemAPIOutDTO } from "../models/common.dto";

/**
 * Controller for Restrictions.
 * This consists of all Rest APIs for restrictions.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("restrictions")
@ApiTags(`${ClientTypeBaseRoute.AEST}-restrictions`)
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
   * Rest API to get restrictions for a student.
   * @param studentId
   * @returns Student Restrictions.
   */
  @Get("/student/:studentId")
  async getStudentRestrictions(
    @Param("studentId") studentId: number,
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
   * REST API to provide the list of restriction categories for drop-down.
   * @returns Categories option list.
   */
  @Get("/categories/options-list")
  async getCategoriesOptionsList(): Promise<OptionItemAPIOutDTO[]> {
    const categories =
      await this.restrictionService.getAllRestrictionCategories();
    return categories.map((category) => ({
      id: category.id,
      description: category.restrictionCategory,
    }));
  }

  /**
   * REST API to provide the list of restriction reasons for selected category.
   * @param restrictionCategory Selected Category from category list.
   * @returns Reasons option list.
   */
  @Get("/reasons/options-list/category/:restrictionCategory")
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
   * Rest API to get the details for view student restriction.
   * @param studentId
   * @param studentRestrictionId
   * @returns Student restriction detail view.
   */
  @ApiNotFoundResponse({
    description: "The student restriction does not exist.",
  })
  @Get("/student/:studentId/studentRestriction/:studentRestrictionId")
  async getStudentRestrictionDetail(
    @Param("studentId") studentId: number,
    @Param("studentRestrictionId") studentRestrictionId: number,
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
      createdBy: getIDIRUserFullName(studentRestriction.creator),
      updatedBy: getIDIRUserFullName(studentRestriction.modifier),
      isActive: studentRestriction.isActive,
      restrictionNote: studentRestriction.restrictionNote?.description,
      resolutionNote: studentRestriction.resolutionNote?.description,
    };
  }

  /**
   * Rest API to add a new provincial restriction to Student.
   * * Note: Federal restrictions are added/resolved by nightly job not through this API.
   * @param userToken
   * @param studentId
   * @param payload
   */
  @Roles(Role.StudentAddRestriction)
  @ApiUnprocessableEntityResponse({
    description:
      "The given restriction type is not Provincial. Only provincial restrictions can be added.",
  })
  @Post("/student/:studentId")
  async addStudentProvincialRestriction(
    @UserToken() userToken: IUserToken,
    @Param("studentId") studentId: number,
    @Body() payload: AssignRestrictionAPIInDTO,
  ): Promise<void> {
    const restriction =
      await this.restrictionService.getProvincialRestrictionById(
        payload.restrictionId,
      );
    if (!restriction) {
      throw new UnprocessableEntityException(
        "The given restriction type is not Provincial. Only provincial restrictions can be added.",
      );
    }
    const updatedRestriction =
      await this.studentRestrictionService.addProvincialRestriction(
        studentId,
        userToken.userId,
        payload,
      );
    /**mapping the note added for restriction to student notes**/
    if (updatedRestriction.restrictionNote) {
      await this.studentService.saveStudentNote(
        studentId,
        updatedRestriction.restrictionNote,
      );
    }
  }

  /**
   * Rest API to resolve a provincial restriction.
   * * Note: Federal restrictions are added/resolved by nightly job not through this API.
   * @param userToken
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
  @Patch("/student/:studentId/studentRestriction/:studentRestrictionId/resolve")
  async resolveStudentProvincialRestriction(
    @UserToken() userToken: IUserToken,
    @Param("studentId") studentId: number,
    @Param("studentRestrictionId") studentRestrictionId: number,
    @Body() payload: ResolveRestrictionAPIInDTO,
  ): Promise<void> {
    if (!payload.noteDescription) {
      throw new UnprocessableEntityException(
        "Resolution Notes are mandatory to resolve the restriction.",
      );
    }
    try {
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
   * Rest API to get restrictions for an institution.
   * @param institutionId
   * @returns Institution Restrictions.
   */
  @Get("/institution/:institutionId")
  async getInstitutionRestrictions(
    @Param("institutionId") institutionId: number,
  ): Promise<RestrictionSummaryAPIOutDTO[]> {
    const institutionRestrictions =
      await this.institutionRestrictionService.getInstitutionRestrictionsById(
        institutionId,
      );
    return institutionRestrictions?.map((institutionRestriction) => ({
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
   * Rest API to get the details for view institution restriction.
   * @param institutionId
   * @param institutionRestrictionId
   * @returns Institution restriction detail view.
   */
  @ApiNotFoundResponse({
    description: "The institution restriction does not exist.",
  })
  @Get(
    "/institution/:institutionId/institutionRestriction/:institutionRestrictionId",
  )
  async getInstitutionRestrictionDetail(
    @Param("institutionId") institutionId: number,
    @Param("institutionRestrictionId") institutionRestrictionId: number,
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
      createdBy: getIDIRUserFullName(institutionRestriction.creator),
      updatedBy: getIDIRUserFullName(institutionRestriction.modifier),
      isActive: institutionRestriction.isActive,
      restrictionNote: institutionRestriction.restrictionNote?.description,
      resolutionNote: institutionRestriction.resolutionNote?.description,
    };
  }

  /**
   * Rest API to add a new provincial restriction to Institution.
   * * Note: Only provincial restriction of category Designation can be added to institution.
   * @param userToken
   * @param institutionId
   * @param payload
   */
  @Roles(Role.InstitutionAddRestriction)
  @ApiUnprocessableEntityResponse({
    description:
      "The given restriction type is either not Provincial or not Institution.",
  })
  @Post("/institution/:institutionId")
  async addInstitutionProvincialRestriction(
    @UserToken() userToken: IUserToken,
    @Param("institutionId") institutionId: number,
    @Body() payload: AssignRestrictionAPIInDTO,
  ): Promise<void> {
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
        payload,
      );
    /**mapping the note added for restriction to institution notes**/
    if (updatedRestriction.restrictionNote) {
      await this.institutionService.saveInstitutionNote(
        institutionId,
        updatedRestriction.restrictionNote,
      );
    }
  }

  /**
   * Rest API to resolve a provincial restriction for Institution.
   * @param userToken
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
    "/institution/:institutionId/institutionRestriction/:institutionRestrictionId/resolve",
  )
  async resolveInstitutionProvincialRestriction(
    @UserToken() userToken: IUserToken,
    @Param("institutionId") institutionId: number,
    @Param("institutionRestrictionId") institutionRestrictionId: number,
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
          payload,
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
   * Rest API to get restriction status for an institution.
   * @param institutionId
   * @returns Institution Restriction.
   */
  @Get("/institution/:institutionId/status")
  async getRestrictionStatusById(
    @Param("institutionId") institutionId: number,
  ): Promise<RestrictionStatusAPIOutDTO> {
    const institutionRestrictions =
      await this.institutionRestrictionService.getRestrictionStatusById(
        institutionId,
      );
    return {
      isActive: !!(
        institutionRestrictions && institutionRestrictions.length > 0
      ),
    } as RestrictionStatusAPIOutDTO;
  }
}
