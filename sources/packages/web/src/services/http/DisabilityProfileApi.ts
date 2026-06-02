import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  PrimaryIdentifierAPIOutDTO,
  SaveStudentDisabilityProfileAPIInDTO,
  StudentDisabilityProfileAPIOutDTO,
  StudentDisabilityProfilesAPIOutDTO,
} from "@/services/http/dto";

/**
 * Http API client for Student Disability Profiles.
 */
export class DisabilityProfileApi extends HttpBaseClient {
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
    return this.getCall(
      this.addClientRoot(`disability-profile/student/${studentId}`),
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
    return this.getCall(
      this.addClientRoot(`disability-profile/${disabilityProfileId}`),
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
    return this.putCall(
      this.addClientRoot(`disability-profile/student/${studentId}/draft`),
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
    await this.putCall(
      this.addClientRoot(`disability-profile/student/${studentId}/active`),
      saveStudentDisabilities,
    );
  }

  /**
   * Deletes a disability profile for the student. Only draft profiles can be deleted.
   * @param disabilityProfileId ID of the disability profile to be deleted.
   */
  async deleteDraftProfile(disabilityProfileId: number): Promise<void> {
    await this.deleteCall(
      this.addClientRoot(`disability-profile/${disabilityProfileId}`),
    );
  }
}
