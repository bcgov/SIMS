import { NotFoundException, Injectable } from "@nestjs/common";
import { StudentRestrictionService } from "../../services";
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
   * Get restrictions for a student for aest view.
   * @param studentId id of the student to retrieve restrictions.
   * @param options for restrictions.
   * - `extendedDetails` option to specify the additional properties to be returned to the Ministry.
   * @returns student restrictions for the provided student id.
   */
  async getStudentRestrictions(
    studentId: number,
    options: { extendedDetails?: boolean },
  ): Promise<RestrictionSummaryAPIOutDTO[]>;

  /**
   * Get restrictions for a student for institution view.
   * @param studentId id of the student to retrieve restrictions.
   * @param options for restrictions.
   * - `filterNoEffectRestrictions` option to filter restrictions based on notificationType.
   * @returns student restrictions for the provided student id.
   */
  async getStudentRestrictions(
    studentId: number,
    options?: { filterNoEffectRestrictions?: boolean },
  ): Promise<RestrictionInstitutionSummaryAPIOutDTO[]>;

  /**
   * Get restrictions for a student.
   * @param studentId id of the student to retrieve restrictions.
   * @param options for restrictions.
   * - `extendedDetails` option to specify the additional properties to be returned to the Ministry.
   * - `filterNoEffectRestrictions` option to filter restrictions based on notificationType.
   * @returns student restrictions for the provided student id.
   */
  async getStudentRestrictions(
    studentId: number,
    options?: {
      extendedDetails?: boolean;
      filterNoEffectRestrictions?: boolean;
    },
  ): Promise<
    RestrictionInstitutionSummaryAPIOutDTO[] | RestrictionSummaryAPIOutDTO[]
  > {
    const studentRestrictions =
      await this.studentRestrictionService.getStudentRestrictionsById(
        studentId,
        {
          filterNoEffectRestrictions: options?.filterNoEffectRestrictions,
          withDeleted: options?.extendedDetails,
        },
      );
    return studentRestrictions?.map((studentRestriction) => ({
      restrictionId: studentRestriction.id,
      restrictionType: studentRestriction.restriction.restrictionType,
      restrictionCategory: studentRestriction.restriction.restrictionCategory,
      restrictionCode: studentRestriction.restriction.restrictionCode,
      description: studentRestriction.restriction.description,
      createdAt: studentRestriction.createdAt,
      resolvedAt: options?.extendedDetails
        ? studentRestriction.resolvedAt
        : undefined,
      deletedAt: options?.extendedDetails
        ? studentRestriction.deletedAt
        : undefined,
      isActive: studentRestriction.isActive,
    }));
  }

  /**
   * Get the details of restriction for aest view.
   * @param studentId id of the student.
   * @param studentRestrictionId id of the student restriction.
   * @param options for restrictions.
   * - `extendedDetails` option to specify the additional properties (updatedBy, updatedAt, resolutionNote) to be returned to the aest.
   * @returns Student restriction detail view.
   */
  async getStudentRestrictionDetail(
    studentId: number,
    studentRestrictionId: number,
    options?: {
      extendedDetails?: boolean;
    },
  ): Promise<RestrictionDetailAPIOutDTO>;

  /**
   * Get the details of restriction for institution view.
   * @param studentId id of the student.
   * @param studentRestrictionId id of the student restriction.
   * @param options for restrictions.
   * - `filterNoEffectRestrictions` option to filter restrictions based on notificationType.
   * @returns Student restriction detail view.
   */
  async getStudentRestrictionDetail(
    studentId: number,
    studentRestrictionId: number,
    options?: {
      filterNoEffectRestrictions?: boolean;
    },
  ): Promise<RestrictionInstitutionDetailAPIOutDTO>;

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
          withDeleted: options?.extendedDetails,
        },
      );
    if (!studentRestriction) {
      throw new NotFoundException("The student restriction does not exist.");
    }
    const restrictionDetail = {
      restrictionId: studentRestriction.id,
      restrictionType: studentRestriction.restriction.restrictionType,
      restrictionCategory: studentRestriction.restriction.restrictionCategory,
      restrictionCode: studentRestriction.restriction.restrictionCode,
      description: studentRestriction.restriction.description,
      isActive: studentRestriction.isActive,
      createdAt: studentRestriction.createdAt,
      createdBy: getUserFullName(studentRestriction.creator),
      restrictionNote: studentRestriction.restrictionNote?.description,
    };
    // Return additional properties for the Ministry view.
    if (options?.extendedDetails) {
      return {
        ...restrictionDetail,
        resolvedAt: studentRestriction.resolvedAt,
        deletedAt: studentRestriction.deletedAt,
        resolvedBy: getUserFullName(studentRestriction.resolvedBy) || undefined,
        deletedBy: getUserFullName(studentRestriction.deletedBy) || undefined,
        resolutionNote: studentRestriction.resolutionNote?.description,
        deletionNote: studentRestriction.deletionNote?.description,
      };
    }
    return restrictionDetail;
  }
}
