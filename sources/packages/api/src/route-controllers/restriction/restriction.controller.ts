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
  RESTRICTION_NOT_ACTIVE,
  RESTRICTION_NOT_PROVINCIAL,
} from "../../services";
import BaseController from "../BaseController";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import { AllowAuthorizedParty, Groups, UserToken } from "../../auth/decorators";
import { IUserToken } from "../../auth/userToken.interface";
import {
  RestrictionSummaryDTO,
  RestrictionDetailDTO,
  ResolveRestrictionDTO,
  AssignRestrictionDTO,
} from "./models/restriction.dto";
import { OptionItem } from "../../types";

/**
 * Controller for Restrictions.
 * This consists of all Rest APIs for restrictions.
 */
@Controller("restrictions")
export class RestrictionController extends BaseController {
  constructor(
    private readonly studentRestrictionService: StudentRestrictionService,
    private readonly restrictionService: RestrictionService,
    private readonly studentService: StudentService,
    private readonly institutionRestrictionService: InstitutionRestrictionService,
  ) {
    super();
  }

  /**
   * Rest API to get restrictions for a student.
   * @param studentId
   * @returns Student Restrictions.
   */
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Get("/student/:studentId")
  async getStudentRestrictions(
    @Param("studentId") studentId: number,
  ): Promise<RestrictionSummaryDTO[]> {
    const studentRestrictions =
      await this.studentRestrictionService.getStudentRestrictionsById(
        studentId,
      );
    return studentRestrictions?.map((studentRestriction) => ({
      restrictionId: studentRestriction.id,
      restrictionType: studentRestriction.restriction.restrictionType,
      restrictionCategory: studentRestriction.restriction.restrictionCategory,
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
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Get("/categories/options-list")
  async getCategoriesOptionsList(): Promise<OptionItem[]> {
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
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Get("/reasons/options-list/category/:restrictionCategory")
  async getReasonsOptionsList(
    @Param("restrictionCategory") restrictionCategory: string,
  ): Promise<OptionItem[]> {
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
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Get("/student/:studentId/studentRestriction/:studentRestrictionId")
  async getStudentRestrictionDetail(
    @Param("studentId") studentId: number,
    @Param("studentRestrictionId") studentRestrictionId: number,
  ): Promise<RestrictionDetailDTO> {
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
      description: studentRestriction.restriction.description,
      createdAt: studentRestriction.createdAt,
      updatedAt: studentRestriction.updatedAt,
      createdBy: studentRestriction.creator
        ? `${studentRestriction.creator.lastName}, ${studentRestriction.creator.firstName}`
        : "",
      updatedBy: studentRestriction.modifier
        ? `${studentRestriction.modifier.lastName}, ${studentRestriction.modifier.firstName}`
        : "",
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
   * @param restrictionId
   * @param payload
   */
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Post("/student/:studentId")
  async addStudentProvincialRestriction(
    @UserToken() userToken: IUserToken,
    @Param("studentId") studentId: number,
    @Body() payload: AssignRestrictionDTO,
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
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Patch("/student/:studentId/studentRestriction/:studentRestrictionId/resolve")
  async resolveStudentProvincialRestriction(
    @UserToken() userToken: IUserToken,
    @Param("studentId") studentId: number,
    @Param("studentRestrictionId") studentRestrictionId: number,
    @Body() payload: ResolveRestrictionDTO,
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
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Get("/institution/:institutionId")
  async getInstitutionRestrictions(
    @Param("studentId") institutionId: number,
  ): Promise<RestrictionSummaryDTO[]> {
    const institutionRestrictions =
      await this.institutionRestrictionService.getInstitutionRestrictionsById(
        institutionId,
      );
    return institutionRestrictions?.map((institutionRestriction) => ({
      restrictionId: institutionRestriction.id,
      restrictionType: institutionRestriction.restriction.restrictionType,
      restrictionCategory:
        institutionRestriction.restriction.restrictionCategory,
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
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Get(
    "/institution/:institutionId/institutionRestriction/:institutionRestrictionId",
  )
  async getInstitutionRestrictionDetail(
    @Param("institutionId") institutionId: number,
    @Param("institutionRestrictionId") institutionRestrictionId: number,
  ): Promise<RestrictionDetailDTO> {
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
      description: institutionRestriction.restriction.description,
      createdAt: institutionRestriction.createdAt,
      updatedAt: institutionRestriction.updatedAt,
      createdBy: institutionRestriction.creator
        ? `${institutionRestriction.creator.lastName}, ${institutionRestriction.creator.firstName}`
        : "",
      updatedBy: institutionRestriction.modifier
        ? `${institutionRestriction.modifier.lastName}, ${institutionRestriction.modifier.firstName}`
        : "",
      isActive: institutionRestriction.isActive,
      restrictionNote: institutionRestriction.restrictionNote?.description,
      resolutionNote: institutionRestriction.resolutionNote?.description,
    };
  }
}
