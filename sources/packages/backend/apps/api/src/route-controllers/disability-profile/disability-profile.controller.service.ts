import { Injectable, NotFoundException } from "@nestjs/common";
import { DisabilityProfileService } from "../../services";
import { getUserFullName } from "../../utilities";
import { SystemLookupConfigurationService } from "@sims/services/system-lookup-configuration";
import { SystemLookupCategory } from "@sims/sims-db";
import { StudentDisabilityProfilesAPIOutDTO } from "./models/disability-profile.dto";

@Injectable()
export class DisabilityProfileControllerService {
  constructor(
    private readonly disabilityProfileService: DisabilityProfileService,
    private readonly systemLookupConfigurationService: SystemLookupConfigurationService,
  ) {}

  /**
   * Gets the disability profiles for the student.
   * @param options filter the disability profiles. At least one filter option must be provided.
   * - `studentId`: ID of the student to get the disability profiles for.
   * - `disabilityProfileId`: ID of the specific disability profile to get.
   * @returns A list of disability profiles matching the provided options.
   */
  async getStudentDisabilityProfiles(options?: {
    studentId?: number;
    disabilityProfileId?: number;
  }): Promise<StudentDisabilityProfilesAPIOutDTO> {
    const studentProfiles =
      await this.disabilityProfileService.getStudentDisabilityProfiles(options);
    if (options?.disabilityProfileId && !studentProfiles?.length) {
      throw new NotFoundException(
        `Disability profile with ID ${options.disabilityProfileId} not found.`,
      );
    }
    return {
      profiles: studentProfiles.map((profile) => ({
        id: profile.id,
        status: profile.disabilityProfileStatus,
        completedBy: getUserFullName(profile.completedBy),
        completedAt: profile.completedAt,
        disabilities: profile.disabilities.map((disability) => ({
          id: disability.id,
          disabilityPriority: disability.disabilityPriority,
          disabilityCategory: disability.disabilityCategory,
          disabilityCategoryDescription:
            this.systemLookupConfigurationService.getSystemLookup(
              SystemLookupCategory.DisabilityCategory,
              disability.disabilityCategory,
            )?.lookupValue ?? disability.disabilityCategory,
          disabilityType: disability.disabilityType,
          disabilityNotes: disability.disabilityNotes,
          diagnosis: disability.diagnosis,
          diagnosisNotes: disability.diagnosisNotes,
          impairments: disability.impairments,
          impairmentsNotes: disability.impairmentsNotes,
          finalNotes: disability.finalNotes,
        })),
        creator: getUserFullName(profile.creator),
        createdAt: profile.createdAt,
        modifier: getUserFullName(profile.modifier) || undefined,
        updatedAt: profile.updatedAt,
      })),
    };
  }
}
