import { StudentRestrictionDTO } from "../route-controllers/student/models/student.dto";
import { RestrictionType } from "../database/entities";
/**
 * Restriction parser reads the raw data from student-restriction service.
 * It builds restriction messages and converts the raw data to student restriction dto.
 */
export class RestrictionParser {
  private studentRestrictions: any[];

  private restrictionMessage: string;

  private provincialMessage =
    "Your account has a hold on it. Please contact SABC to resolve.";

  private federalMessage =
    "Your account has a hold on it. Please contact CSFA to resolve.";

  private restrictionMap: Map<RestrictionType, boolean> = new Map([
    [RestrictionType.Provincial, false],
    [RestrictionType.Federal, false],
  ]);

  constructor(studentRestrictions: any[]) {
    this.studentRestrictions = studentRestrictions;
    this.init();
  }
  /**
   * @returns restriction flag
   */
  hasRestriction(): boolean {
    return this.hasProvincialRestriction() || this.hadFederalRestriction();
  }

  /**
   * @returns provincial restriction flag
   */
  hasProvincialRestriction(): boolean {
    return this.restrictionMap.get(RestrictionType.Provincial);
  }

  /**
   * @returns federal restriction flag
   */
  hadFederalRestriction(): boolean {
    return this.restrictionMap.get(RestrictionType.Federal);
  }

  /**
   * Init method which poplates data for validation.
   */
  init(): void {
    if (!this.studentRestrictions || this.studentRestrictions.length <= 0) {
      return;
    }
    this.studentRestrictions.forEach((studentRestriction) => {
      if (
        RestrictionType.Provincial.toString() ===
          studentRestriction.restictiontype &&
        !this.restrictionMap.get(RestrictionType.Provincial)
      ) {
        this.restrictionMap.set(RestrictionType.Provincial, true);
        this.restrictionMessage = this.restrictionMessage
          ? this.restrictionMessage + " " + this.provincialMessage
          : this.provincialMessage;
      }

      if (
        RestrictionType.Federal.toString() ===
          studentRestriction.restictiontype &&
        !this.restrictionMap.get(RestrictionType.Federal)
      ) {
        this.restrictionMap.set(RestrictionType.Federal, true);
        this.restrictionMessage = this.restrictionMessage
          ? this.restrictionMessage + " " + this.federalMessage
          : this.federalMessage;
      }
    });
  }
  /**
   * Builds restriction message.
   * @returns restricition message
   */
  getRestrictionMessage(): string {
    return this.restrictionMessage;
  }

  /**
   * Transforms raw data to dto.
   * @returns Student restriction dto
   */
  getStudentRestrictionResponse(): StudentRestrictionDTO {
    if (!this.hasRestriction()) {
      return {
        hasRestriction: false,
        hasFederalRestriction: false,
        hasProvincialRestriction: false,
        restrictionMessage: null,
      } as StudentRestrictionDTO;
    }

    return {
      hasRestriction: this.hasRestriction(),
      hasFederalRestriction: this.hadFederalRestriction(),
      hasProvincialRestriction: this.hasProvincialRestriction(),
      restrictionMessage: this.getRestrictionMessage(),
    } as StudentRestrictionDTO;
  }
}
