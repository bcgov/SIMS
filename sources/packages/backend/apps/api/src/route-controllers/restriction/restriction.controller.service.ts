import {
  Param,
  ParseIntPipe,
  NotFoundException,
  Injectable,
} from "@nestjs/common";
import { StudentRestrictionService } from "../../services";
import {
  RestrictionSummaryAPIOutDTO,
  RestrictionDetailAPIOutDTO,
} from "./models/restriction.dto";
import { getUserFullName } from "../../utilities";
import { ApiNotFoundResponse } from "@nestjs/swagger";
import { RestrictionNotificationType } from "@sims/sims-db/entities";

@Injectable()
export class RestrictionControllerService {
  constructor(
    private readonly studentRestrictionService: StudentRestrictionService,
  ) {}

  /**
   * Get restrictions for a student.
   * @param studentId id of the student to retrieve restrictions.
   * @param options query options.
   * - `filterRestrictions` option to filter restrictions based on notificationType and restrictionCategory.
   * @returns student restrictions for the provided student id.
   */
  async getStudentRestrictions(
    @Param("studentId", ParseIntPipe) studentId: number,
    options?: {
      filterRestrictions?: boolean;
    },
  ): Promise<RestrictionSummaryAPIOutDTO[]> {
    let studentRestrictions =
      await this.studentRestrictionService.getStudentRestrictionsById(
        studentId,
      );
    if (options?.filterRestrictions) {
      const filteredStudentRestrictions = studentRestrictions.filter(
        (studentRestriction) =>
          studentRestriction.restriction.notificationType !==
            RestrictionNotificationType.NoEffect &&
          studentRestriction.restriction.restrictionCategory.toLowerCase() !==
            "verification",
      );
      studentRestrictions = filteredStudentRestrictions;
    }
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
   * Get the details for view student restriction.
   * @param studentId id of the student.
   * @param studentRestrictionId id of the student restriction.
   * @returns Student restriction detail view.
   */
  @ApiNotFoundResponse({
    description: "The student restriction does not exist.",
  })
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
}
