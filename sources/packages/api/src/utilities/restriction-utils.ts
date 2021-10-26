import { StudentRestrictionDTO } from "src/route-controllers/student/models/student-restriction.dto";
import { StudentRestriction, RestrictionType } from "../database/entities";
/**
 * Parses the Student restriction data and returns the details which are required to validate
 */
export class RestrictionParser {
  private studentRestrictions: StudentRestriction[];

  private restrictionMap: Map<RestrictionType, boolean> = new Map([
    [RestrictionType.Provincial, false],
    [RestrictionType.Federal, false],
  ]);

  constructor(studentRestrictions: StudentRestriction[]) {
    this.studentRestrictions = studentRestrictions;
    this.init();
  }

  hasRestriction(): boolean {
    return this.hasProvincialRestriction() || this.hadFederalRestriction();
  }

  hasProvincialRestriction(): boolean {
    return this.restrictionMap.get(RestrictionType.Provincial);
  }

  hadFederalRestriction(): boolean {
    return this.restrictionMap.get(RestrictionType.Federal);
  }

  init(): void {
    if (!this.studentRestrictions || !(this.studentRestrictions.length > 0)) {
      return;
    }
    const restrictionOccurance: Map<number, number> = new Map();
    this.studentRestrictions.forEach((studentRestriction) => {
      const resctrictionId = studentRestriction.restriction.id;
      restrictionOccurance.set(
        resctrictionId,
        restrictionOccurance.has(resctrictionId)
          ? restrictionOccurance.get(resctrictionId) + 1
          : 1,
      );

      if (
        restrictionOccurance.get(resctrictionId) >
        studentRestriction.restriction.allowedCount
      ) {
        this.restrictionMap.set(
          studentRestriction.restriction.restrictionType,
          true,
        );
      }
    });
  }

  getRestrictionMessage(): string {
    if (!this.hasRestriction()) {
      return null;
    }
    let getRestrictionMessage = "";
    if (this.hasProvincialRestriction()) {
      getRestrictionMessage =
        "Your account has a hold on it. Please contact SABC to resolve.";
    }
    if (this.hadFederalRestriction()) {
      getRestrictionMessage =
        getRestrictionMessage +
        " " +
        "Your account has a hold on it. Please contact CSFA to resolve.";
    }
    return getRestrictionMessage;
  }

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
