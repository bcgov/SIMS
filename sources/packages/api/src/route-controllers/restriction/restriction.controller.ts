import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  StudentRestrictionService,
  RestrictionService,
  StudentService,
} from "../../services";
import BaseController from "../BaseController";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import { AllowAuthorizedParty, Groups, UserToken } from "../../auth/decorators";
import { IUserToken } from "../../auth/userToken.interface";
import {
  StudentRestrictionSummary,
  StudentRestrictionDetail,
  UpdateRestrictionDTO,
} from "./models/restriction.dto";
import { OptionItem } from "../../types";
import {
  Restriction,
  StudentRestriction,
  Student,
  User,
  Note,
} from "../../database/entities";
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
  ): Promise<StudentRestrictionSummary[]> {
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
   * REST API to provide the list of restriction categories for drop-down
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

  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Get("/student/:studentId/restriction/:restrictionId")
  async getStudentRestrictionDetail(
    @Param("studentId") studentId: number,
    @Param("restrictionId") restrictionId: number,
  ): Promise<StudentRestrictionDetail> {
    const studentRestriction =
      await this.studentRestrictionService.getStudentRestrictionDetailsById(
        studentId,
        restrictionId,
      );
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
      resolutionNote: studentRestriction.restrictionNote?.description,
    };
  }

  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Post("/student/:studentId/restriction/:restrictionId")
  async addStudentProvincialRestriction(
    @UserToken() userToken: IUserToken,
    @Param("studentId") studentId: number,
    @Param("restrictionId") restrictionId: number,
    @Body() payload: UpdateRestrictionDTO,
  ): Promise<void> {
    const restriction =
      await this.restrictionService.getProvincialRestrictionById(restrictionId);
    if (!restriction) {
      throw new UnprocessableEntityException(
        "The given restriction type is not Provincial. Only provincial restrictions can be added. ",
      );
    }
    const studentRestriction = new StudentRestriction();
    studentRestriction.student = { id: studentId } as Student;
    studentRestriction.restriction = restriction;
    studentRestriction.creator = { id: userToken.userId } as User;

    if (payload.noteDescription) {
      studentRestriction.restrictionNote = {
        description: payload.noteDescription,
      } as Note;
    }

    const updatedRestriction =
      await this.studentRestrictionService.addStudentProvincialRestriction(
        studentId,
        restrictionId,
        studentRestriction,
      );
    if (updatedRestriction.restrictionNote) {
      await this.studentService.saveStudentNote(
        studentId,
        updatedRestriction.restrictionNote,
      );
    }
  }
}
