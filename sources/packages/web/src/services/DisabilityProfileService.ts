import ApiClient from "@/services/http/ApiClient";
import {
  PrimaryIdentifierAPIOutDTO,
  SaveStudentDisabilityProfileAPIInDTO,
  StudentDisabilityProfileAPIOutDTO,
  StudentDisabilityProfilesAPIOutDTO,
} from "@/services/http/dto";

export class DisabilityProfileService {
  // Share Instance
  private static instance: DisabilityProfileService;

  static get shared(): DisabilityProfileService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Retrieves the disability profiles for the student.
   * The student usually may have up to one active and one draft disability profile.
   * Archived profiles may vary but are not expected to be more than a few for a student.
   * @param studentId ID of the student.
   * @return disability profiles of the student.
   */
  async getStudentDisabilityProfiles(
    studentId: number,
  ): Promise<StudentDisabilityProfilesAPIOutDTO> {
    return ApiClient.DisabilityProfileApi.getStudentDisabilityProfiles(
      studentId,
    );
  }

  /**
   * Retrieves a specific disability profile for the student.
   * @param disabilityProfileId ID of the disability profile.
   * @return disability profile of the student.
   */
  async getStudentDisabilityProfile(
    disabilityProfileId: number,
  ): Promise<StudentDisabilityProfileAPIOutDTO> {
    return ApiClient.DisabilityProfileApi.getStudentDisabilityProfile(
      disabilityProfileId,
    );
  }

  /**
   * Updates an existing disability draft profile for the student, or creates a new one if it doesn't exist.
   * Only one draft profile can exist for a student at a time.
   * @param studentId ID of the student.
   * @param saveStudentDisabilities information of the disability profile to be saved as draft, including the
   * disabilities and optionally the draft profile ID to be updated.
   * @return the ID of the saved draft disability profile.
   */
  async saveDraftProfile(
    studentId: number,
    saveStudentDisabilities: SaveStudentDisabilityProfileAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return ApiClient.DisabilityProfileApi.saveDraftProfile(
      studentId,
      saveStudentDisabilities,
    );
  }

  /**
   * Creates new active profile or converts a draft profile to an active profile.
   * @param studentId ID of the student.
   * @param saveStudentDisabilities information of the disability profile to be saved as active,
   * including the disabilities and optionally the draft profile ID to be completed.
   */
  async saveActiveProfile(
    studentId: number,
    saveStudentDisabilities: SaveStudentDisabilityProfileAPIInDTO,
  ): Promise<void> {
    await ApiClient.DisabilityProfileApi.saveActiveProfile(
      studentId,
      saveStudentDisabilities,
    );
  }

  /**
   * Deletes a disability profile for the student. Only draft profiles can be deleted.
   * @param disabilityProfileId ID of the disability profile to be deleted.
   */
  async deleteDraftProfile(disabilityProfileId: number): Promise<void> {
    await ApiClient.DisabilityProfileApi.deleteDraftProfile(
      disabilityProfileId,
    );
  }
}
