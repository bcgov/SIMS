import { NotFoundException, Injectable } from "@nestjs/common";
import { StudentRestrictionService } from "../../services";
import { StudentRestriction } from "@sims/sims-db";
import {
  RestrictionDetailAPIOutDTO,
  RestrictionInstitutionDetailAPIOutDTO,
  RestrictionInstitutionSummaryAPIOutDTO,
  RestrictionSummaryAPIOutDTO,
} from "./models/restriction.dto";
import { getUserFullName } from "../../utilities";

@Injectable()
export class RestrictionControllerService {
  constructor(
    private readonly studentRestrictionService: StudentRestrictionService,
  ) {}

  /**
   * Get restrictions for a student.
   * @param studentId id of the student to retrieve restrictions.
   * @param options to filter restrictions.
   * - `extendedDetails` option to specify the additional property (updatedAt) to be returned to the aest.
   * - `filterNoEffectRestrictions` option to filter restrictions based on notificationType.
   * - `onlyActive` onlyActive is a flag, which decides whether to select all or only the active restrictions.
   * @returns student restrictions for the provided student id.
   */
  async getStudentRestrictions(
    studentId: number,
    options?: {
      extendedDetails?: boolean;
      filterNoEffectRestrictions?: boolean;
      onlyActive?: boolean;
    },
  ): Promise<
    RestrictionInstitutionSummaryAPIOutDTO[] | RestrictionSummaryAPIOutDTO[]
  > {
    const studentRestrictions =
      await this.studentRestrictionService.getStudentRestrictionsById(
        studentId,
        {
          filterNoEffectRestrictions: options?.filterNoEffectRestrictions,
          onlyActive: options?.onlyActive,
        },
      );
    return studentRestrictions?.map((studentRestriction) => ({
      restrictionId: studentRestriction.id,
      restrictionType: studentRestriction.restriction.restrictionType,
      restrictionCategory: studentRestriction.restriction.restrictionCategory,
      restrictionCode: studentRestriction.restriction.restrictionCode,
      description: studentRestriction.restriction.description,
      createdAt: studentRestriction.createdAt,
      updatedAt: options?.extendedDetails
        ? studentRestriction.updatedAt
        : undefined,
      isActive: studentRestriction.isActive,
    }));
  }

  /**
   * Get the details for view student restriction.
   * @param studentId id of the student.
   * @param studentRestrictionId id of the student restriction.
   * @param options to filter restrictions.
   * - `extendedDetails` option to specify the additional properties (updatedBy, updatedAt, resolutionNote) to be returned to the aest.
   * - `filterNoEffectRestrictions` option to filter restrictions based on notificationType.
   * @returns Student restriction detail view.
   */
  async getStudentRestrictionDetail(
    studentId: number,
    studentRestrictionId: number,
    options?: {
      extendedDetails?: boolean;
      filterNoEffectRestrictions?: boolean;
    },
  ): Promise<
    RestrictionDetailAPIOutDTO | RestrictionInstitutionDetailAPIOutDTO
  > {
    const studentRestriction =
      await this.studentRestrictionService.getStudentRestrictionDetailsById(
        studentId,
        studentRestrictionId,
        {
          filterNoEffectRestrictions: options?.filterNoEffectRestrictions,
        },
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
      updatedAt: options?.extendedDetails
        ? studentRestriction.updatedAt
        : undefined,
      createdBy: getUserFullName(studentRestriction.creator),
      updatedBy: options?.extendedDetails
        ? getUserFullName(studentRestriction.modifier)
        : undefined,
      isActive: studentRestriction.isActive,
      restrictionNote: studentRestriction.restrictionNote?.description,
      resolutionNote: options?.extendedDetails
        ? studentRestriction.resolutionNote?.description
        : undefined,
    };
  }
}
