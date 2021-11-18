import { credentialTypeToDisplay } from "../../utilities/credential-type-utils";
import { EducationProgramDto } from "../../route-controllers/education-program/models/save-education-program.dto";
import { ProgramIntensity } from "../../database/entities/program-intensity.type";
/**
 * Service level interface for education programs object.
 */
export interface SaveEducationProgram extends EducationProgramDto {
  id?: number;
  institutionId: number;
  approvalStatus: string;
}

export class EducationProgramsSummary {
  id: number;
  name: string;
  cipCode: string;
  credentialType: string;
  credentialTypeOther: string;
  approvalStatus: string;
  totalOfferings: number;
  get credentialTypeToDisplay(): string {
    return credentialTypeToDisplay(
      this.credentialType,
      this.credentialTypeOther,
    );
  }
}

export class EducationProgramModel {
  id: number;
  name: string;
  description: string;
  credentialType: string;
  credentialTypeOther: string;
  cipCode: string;
  nocCode: string;
  sabcCode: string;
  approvalStatus: string;
  programIntensity: ProgramIntensity;
  get credentialTypeToDisplay(): string {
    return credentialTypeToDisplay(
      this.credentialType,
      this.credentialTypeOther,
    );
  }
}
