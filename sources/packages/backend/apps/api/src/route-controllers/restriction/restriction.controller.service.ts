import { NotFoundException, Injectable } from "@nestjs/common";
import { StudentRestrictionService } from "../../services";
import { StudentRestriction } from "@sims/sims-db";

@Injectable()
export class RestrictionControllerService {
  constructor(
    private readonly studentRestrictionService: StudentRestrictionService,
  ) {}

  /**
   * Get restrictions for a student.
   * @param studentId id of the student to retrieve restrictions.
   * @param options to filter restrictions.
   * - `filterNoEffectRestrictions` option to filter restrictions based on notificationType.
   * - `onlyActive` onlyActive is a flag, which decides whether to select all or only the active restrictions.
   * @returns student restrictions for the provided student id.
   */
  async getStudentRestrictions(
    studentId: number,
    options?: {
      filterNoEffectRestrictions?: boolean;
      onlyActive?: boolean;
    },
  ): Promise<StudentRestriction[]> {
    const studentRestrictions =
      await this.studentRestrictionService.getStudentRestrictionsById(
        studentId,
        {
          filterNoEffectRestrictions: options?.filterNoEffectRestrictions,
          onlyActive: options?.onlyActive,
        },
      );
    return studentRestrictions;
  }

  /**
   * Get the details for view student restriction.
   * @param studentId id of the student.
   * @param studentRestrictionId id of the student restriction.
   * @param options to filter restrictions.
   * - `filterNoEffectRestrictions` option to filter restrictions based on notificationType.
   * @returns Student restriction detail view.
   */
  async getStudentRestrictionDetail(
    studentId: number,
    studentRestrictionId: number,
    options?: {
      filterNoEffectRestrictions?: boolean;
    },
  ): Promise<StudentRestriction> {
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
    return studentRestriction;
  }
}
