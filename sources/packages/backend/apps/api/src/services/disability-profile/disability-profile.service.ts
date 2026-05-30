import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { StudentDisabilityModel } from "./disability-profile.models";
import {
  DisabilityProfileStatus,
  Student,
  StudentDisabilityProfile,
  StudentDisabilityProfileDisability,
  SystemLookupCategory,
  User,
} from "@sims/sims-db/entities";
import { SystemLookupConfigurationService } from "@sims/services/system-lookup-configuration";
import { CustomNamedError } from "@sims/utilities";
import {
  DISABILITY_PROFILE_COMPLETE_WHEN_DRAFT_ALREADY_EXISTS,
  DISABILITY_PROFILE_DRAFT_NOT_FOUND,
  DISABILITY_PROFILE_INVALID_CATEGORY,
  DISABILITY_PROFILE_INVALID_DISABILITY_TYPE,
  DISABILITY_PROFILE_INVALID_IMPAIRMENT,
  DISABILITY_PROFILE_INVALID_PRIORITY,
} from "../../constants";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class DisabilityProfileService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly systemLookupConfigurationService: SystemLookupConfigurationService,
    @InjectRepository(StudentDisabilityProfile)
    private readonly studentDisabilityProfileRepo: Repository<StudentDisabilityProfile>,
  ) {}

  /**
   * Gets the disability profiles for the student.
   * @param options filter the disability profiles. At least one filter option must be provided.
   * - `studentId`: ID of the student to get the disability profiles for. If not provided, all disability profiles will be returned.
   * - `disabilityProfileId`: ID of the specific disability profile to get. If not provided, all disability profiles for the student will be returned.
   * @returns A list of disability profiles matching the provided options.
   */
  async getStudentDisabilityProfiles(options?: {
    studentId?: number;
    disabilityProfileId?: number;
  }): Promise<StudentDisabilityProfile[]> {
    if (!options?.disabilityProfileId && !options?.studentId) {
      throw new Error("At least one filter option must be provided.");
    }
    return this.studentDisabilityProfileRepo.find({
      select: {
        id: true,
        disabilityProfileStatus: true,
        completedBy: {
          id: true,
          firstName: true,
          lastName: true,
        },
        completedAt: true,
        disabilities: {
          id: true,
          disabilityPriority: true,
          disabilityCategory: true,
          disabilityType: true,
          disabilityNotes: true,
          impairments: true,
          impairmentsNotes: true,
          diagnosis: true,
          diagnosisNotes: true,
          finalNotes: true,
        },
        creator: {
          id: true,
          firstName: true,
          lastName: true,
        },
        createdAt: true,
        modifier: {
          id: true,
          firstName: true,
          lastName: true,
        },
        updatedAt: true,
      },
      relations: {
        completedBy: true,
        disabilities: true,
        creator: true,
        modifier: true,
      },
      where: {
        student: {
          id: options?.studentId,
        },
        id: options?.disabilityProfileId,
      },
      order: {
        completedAt: "DESC",
        disabilities: {
          disabilityPriority: "ASC",
        },
      },
    });
  }

  /**
   * Creates a new disability draft profile for the student or updates the existing draft profile
   * if it already exists and the disabilityProfileId is provided.
   * @param studentId ID of the student.
   * @param disabilities information of the disability profile to be saved as draft, including the
   * disabilities and optionally the draft profile ID to be updated.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param disabilityProfileId ID of the draft disability profile to be updated. If not provided,
   * a new draft profile will be created.
   * @returns the saved draft disability profile.
   */
  async saveDraftProfile(
    studentId: number,
    disabilities: StudentDisabilityModel[],
    auditUserId: number,
    disabilityProfileId?: number,
  ): Promise<StudentDisabilityProfile> {
    this.validateDisabilitiesPriorities(disabilities);
    this.validateLookupData(disabilities);
    return this.dataSource.transaction(async (entityManager) => {
      const studentDisabilityProfileRepo = entityManager.getRepository(
        StudentDisabilityProfile,
      );
      const now = new Date();
      const auditUser = { id: auditUserId } as User;
      let disabilityProfile: StudentDisabilityProfile | null = null;
      // Retrieve the existing draft disability profile for the student, if exists.
      disabilityProfile = await studentDisabilityProfileRepo.findOne({
        select: {
          id: true,
          disabilityProfileStatus: true,
          disabilities: {
            id: true,
          },
        },
        relations: {
          disabilities: true,
        },
        where: {
          student: {
            id: studentId,
          },
          disabilityProfileStatus: DisabilityProfileStatus.Draft,
        },
      });
      if (disabilityProfile) {
        // A draft profile exists for the student.
        if (disabilityProfile.id !== disabilityProfileId) {
          // The provided disabilityProfileId does not match the existing draft profile ID, so the draft profile cannot be updated.
          // A new draft profile cannot be created if there is an existing draft profile.
          throw new CustomNamedError(
            `The provided draft disability profile ID ${disabilityProfileId} does not match the existing draft profile ID.`,
            DISABILITY_PROFILE_DRAFT_NOT_FOUND,
          );
        }
        // Draft profile exists and will be updated.
        disabilityProfile.modifier = auditUser;
        disabilityProfile.updatedAt = now;
      } else {
        // If an existing draft profile does not exist a new draft profile will be created.
        disabilityProfile = new StudentDisabilityProfile();
        disabilityProfile.disabilityProfileStatus =
          DisabilityProfileStatus.Draft;
        disabilityProfile.student = { id: studentId } as Student;
        disabilityProfile.creator = auditUser;
        disabilityProfile.createdAt = now;
      }
      disabilityProfile.disabilities = this.prepareProfileDisabilities(
        disabilities,
        disabilityProfile.disabilities,
        auditUser,
        now,
      );
      return studentDisabilityProfileRepo.save(disabilityProfile);
    });
  }

  /**
   * Creates a new active disability profile for the student or updates the existing draft profile to become active.
   * If the disabilityProfileId is provided, it must represent a draft profile for the student that will be updated to become active.
   * Only one active profile can exist for a student at a time. If an active profile already exists when creating a new active profile,
   * the existing active profile will be updated to become archived.
   * @param studentId the ID of the student for whom the active profile is being created or the draft profile is being updated.
   * @param disabilities the list of disabilities to be included in the active profile.
   * @param auditUserId the ID of the user performing the operation.
   * @param disabilityProfileId the ID of the draft disability profile to be updated. If not provided, a new active profile will be created.
   * @returns the saved active disability profile.
   */
  async saveActiveProfile(
    studentId: number,
    disabilities: StudentDisabilityModel[],
    auditUserId: number,
    disabilityProfileId?: number,
  ): Promise<StudentDisabilityProfile> {
    this.validateDisabilitiesPriorities(disabilities);
    this.validateLookupData(disabilities);
    return this.dataSource.transaction(async (entityManager) => {
      const studentDisabilityProfileRepo = entityManager.getRepository(
        StudentDisabilityProfile,
      );
      const now = new Date();
      const auditUser = { id: auditUserId } as User;
      // Retrieve the existing draft disability profile for the student, if exists.
      // This serves multiple purposes using a single query:
      // - validating the provided disabilityProfileId (if provided) represents a draft profile for the student,
      // - retrieving the existing draft profile to be updated (if disabilityProfileId is provided), or
      // - validating that there is no existing draft profile when creating a new active profile (when disabilityProfileId is not provided).
      let disabilityProfile: StudentDisabilityProfile | null =
        await studentDisabilityProfileRepo.findOne({
          select: {
            id: true,
            disabilityProfileStatus: true,
            disabilities: {
              id: true,
            },
          },
          relations: {
            disabilities: true,
          },
          where: {
            student: { id: studentId },
            disabilityProfileStatus: DisabilityProfileStatus.Draft,
          },
        });
      if (
        disabilityProfileId &&
        disabilityProfileId !== disabilityProfile?.id
      ) {
        // The disabilityProfileId does not represent a draft profile for the student.
        throw new CustomNamedError(
          `Draft disability profile ID ${disabilityProfileId} not found to be updated to complete.`,
          DISABILITY_PROFILE_DRAFT_NOT_FOUND,
        );
      }
      if (!disabilityProfileId && disabilityProfile) {
        // The student has a draft profile that must be completed or deleted.
        throw new CustomNamedError(
          `The student profile has a draft ${disabilityProfile.id} that must be completed or deleted before creating a new active profile.`,
          DISABILITY_PROFILE_COMPLETE_WHEN_DRAFT_ALREADY_EXISTS,
        );
      }
      if (disabilityProfile) {
        // Draft profile exists and will be updated.
        disabilityProfile.modifier = auditUser;
        disabilityProfile.updatedAt = now;
      } else {
        // Draft profile does not exist, create a new profile with active status.
        disabilityProfile = new StudentDisabilityProfile();
        disabilityProfile.student = { id: studentId } as Student;
        disabilityProfile.creator = auditUser;
        disabilityProfile.createdAt = now;
      }
      disabilityProfile.disabilityProfileStatus =
        DisabilityProfileStatus.Active;
      disabilityProfile.completedBy = auditUser;
      disabilityProfile.completedAt = now;
      disabilityProfile.disabilities = this.prepareProfileDisabilities(
        disabilities,
        disabilityProfile?.disabilities,
        auditUser,
        now,
      );
      // Update the current active profile (if exists) to archived status, since only one active profile is allowed.
      await studentDisabilityProfileRepo.update(
        {
          student: {
            id: studentId,
          },
          disabilityProfileStatus: DisabilityProfileStatus.Active,
        },
        {
          disabilityProfileStatus: DisabilityProfileStatus.Archived,
          modifier: auditUser,
          updatedAt: now,
        },
      );
      return studentDisabilityProfileRepo.save(disabilityProfile);
    });
  }

  /**
   * Prepares the disabilities for a disability profile by upserting the provided disabilities
   * and marking as deleted the disabilities that are not included in the provided list but exist in the profile.
   * @param disabilitiesToSave the list of disabilities to be saved or updated.
   * @param existingDisabilities the list of existing disabilities in the profile.
   * @param auditUser the user performing the operation.
   * @param now the current date and time.
   * @returns the list of updated disabilities for the profile.
   */
  private prepareProfileDisabilities(
    disabilitiesToSave: StudentDisabilityModel[],
    existingDisabilities: StudentDisabilityProfileDisability[] | undefined,
    auditUser: User,
    now: Date,
  ): StudentDisabilityProfileDisability[] {
    const updatedDisabilities: StudentDisabilityProfileDisability[] = [];
    for (const disabilityToSave of disabilitiesToSave ?? []) {
      // Upsert all disabilities included in the request.
      const disability = new StudentDisabilityProfileDisability();
      disability.disabilityPriority = disabilityToSave.disabilityPriority;
      disability.disabilityCategory = disabilityToSave.disabilityCategory;
      disability.disabilityType = disabilityToSave.disabilityType;
      disability.disabilityNotes = disabilityToSave.disabilityNotes;
      disability.diagnosis = disabilityToSave.diagnosis;
      disability.diagnosisNotes = disabilityToSave.diagnosisNotes;
      disability.impairments = disabilityToSave.impairments;
      disability.impairmentsNotes = disabilityToSave.impairmentsNotes;
      disability.finalNotes = disabilityToSave.finalNotes;
      const existingDisability = existingDisabilities?.find(
        (d) => d.id === disabilityToSave.id,
      );
      if (existingDisability) {
        disability.id = existingDisability.id;
        disability.modifier = auditUser;
        disability.updatedAt = now;
      } else {
        disability.creator = auditUser;
        disability.createdAt = now;
      }
      updatedDisabilities.push(disability);
    }
    if (!existingDisabilities) {
      return updatedDisabilities;
    }
    // Check for disabilities that were removed in the update and mark them as deleted.
    const updatedDisabilitiesIDs = updatedDisabilities.map(
      (disability) => disability.id,
    );
    const deletedDisabilities = existingDisabilities
      .filter((disability) => !updatedDisabilitiesIDs.includes(disability.id))
      .map((disability) => {
        disability.deletedAt = now;
        disability.modifier = auditUser;
        disability.updatedAt = now;
        return disability;
      });
    // Ensures the deleted disabilities are updated first, avoiding
    // unique constraint conflicts with the updated disabilities.
    return [...deletedDisabilities, ...updatedDisabilities];
  }

  /**
   * Ensure the disability priorities are valid, they must start at 1,
   * be unique, and have no gaps in the sequence.
   * @param disabilities the list of disabilities to validate.
   */
  private validateDisabilitiesPriorities(
    disabilities: StudentDisabilityModel[],
  ): void {
    const sortedPriorities = disabilities
      .map((d) => d.disabilityPriority)
      .sort((a, b) => a - b);
    const isValidSequence = sortedPriorities.every((p, i) => p === i + 1);
    if (!isValidSequence) {
      throw new CustomNamedError(
        "Disability priorities must start at 1, be unique, and have no gaps in the sequence.",
        DISABILITY_PROFILE_INVALID_PRIORITY,
      );
    }
  }

  /**
   * Ensure the lookup data for the disabilities is valid.
   * @param disabilities the list of disabilities to validate.
   */
  private validateLookupData(disabilities: StudentDisabilityModel[]): void {
    for (const disability of disabilities) {
      // Disability type
      const hasValidDisabilityType =
        this.systemLookupConfigurationService.isValidSystemLookup(
          SystemLookupCategory.DisabilityType,
          disability.disabilityType,
        );
      if (!hasValidDisabilityType) {
        throw new CustomNamedError(
          `Invalid disability type: ${disability.disabilityType}`,
          DISABILITY_PROFILE_INVALID_DISABILITY_TYPE,
        );
      }
      // Disability category
      const hasValidDisabilityCategory =
        this.systemLookupConfigurationService.isValidSystemLookup(
          SystemLookupCategory.DisabilityCategory,
          disability.disabilityCategory,
        );
      if (!hasValidDisabilityCategory) {
        throw new CustomNamedError(
          `Invalid disability category: ${disability.disabilityCategory}`,
          DISABILITY_PROFILE_INVALID_CATEGORY,
        );
      }
      // Impairments
      for (const impairment of disability.impairments) {
        const hasValidImpairment =
          this.systemLookupConfigurationService.isValidSystemLookup(
            SystemLookupCategory.DisabilityImpairment,
            impairment,
          );
        if (!hasValidImpairment) {
          throw new CustomNamedError(
            `Invalid disability impairment: ${impairment}`,
            DISABILITY_PROFILE_INVALID_IMPAIRMENT,
          );
        }
      }
    }
  }

  /**
   * Deletes a draft disability profile.
   * @param disabilityProfileId the ID of the draft disability profile to be deleted.
   * @param auditUserId the ID of the user performing the deletion.
   */
  async deleteDraftProfile(
    disabilityProfileId: number,
    auditUserId: number,
  ): Promise<void> {
    const now = new Date();
    const auditUser = { id: auditUserId } as User;
    const result = await this.studentDisabilityProfileRepo.update(
      {
        id: disabilityProfileId,
        disabilityProfileStatus: DisabilityProfileStatus.Draft,
      },
      { deletedAt: now, modifier: auditUser, updatedAt: now },
    );
    if (!result.affected) {
      throw new CustomNamedError(
        `Draft disability profile ID ${disabilityProfileId} not found.`,
        DISABILITY_PROFILE_DRAFT_NOT_FOUND,
      );
    }
  }
}
