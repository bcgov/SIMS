import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
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
   * @param studentId ID of the student.
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
   * @param studentId ID of the student.
   * @param disabilityProfileId ID of the disability profile.
   */
  async getStudentDisabilityProfile(
    studentId: number,
    disabilityProfileId: number,
  ): Promise<StudentDisabilityProfileAPIOutDTO> {
    return this.getCall(
      this.addClientRoot(
        `disability-profile/student/${studentId}/disability-profile/${disabilityProfileId}`,
      ),
    );
  }

  /**
   * Updates an existing disability draft profile for the student, or creates a new one if it doesn't exist.
   * Only one draft profile can exist for a student at a time.
   * @param studentId ID of the student.
   * @param saveStudentDisabilities information of the disability profile to be saved as draft, including the
   * disabilities and optionally the draft profile ID to be updated.
   */
  async saveDraftProfile(
    studentId: number,
    saveStudentDisabilities: SaveStudentDisabilityProfileAPIInDTO,
  ): Promise<void> {
    await this.putCall(
      this.addClientRoot(`disability-profile/student/${studentId}/draft`),
      saveStudentDisabilities,
    );
  }

  /**
   * Creates or updates an active disability profile for the student. If a draft profile exists,
   * it will be completed and become the active profile.
   * If no draft profile exists, a new active profile will be created with the provided disabilities.
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
   * @param studentId ID of the student.
   * @param disabilityProfileId ID of the disability profile to be deleted.
   */
  async deleteDraftProfile(
    studentId: number,
    disabilityProfileId: number,
  ): Promise<void> {
    await this.deleteCall(
      this.addClientRoot(
        `disability-profile/student/${studentId}/disability-profile/${disabilityProfileId}`,
      ),
    );
  }
}
