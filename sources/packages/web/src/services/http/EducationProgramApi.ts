import {
  OptionItemDto,
  ApproveProgram,
  DeclineProgram,
  StudentEducationProgramAPIOutDTO,
  PaginationOptions,
} from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";
import { getPaginationQueryString } from "@/helpers";
import {
  AESTEducationProgramAPIOutDTO,
  EducationProgramAPIInDTO,
  EducationProgramAPIOutDTO,
  EducationProgramsSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";

export class EducationProgramApi extends HttpBaseClient {
  /**
   * Get programs summary for a particular location with pagination.
   * @param locationId id of the location.
   * @param paginationOptions pagination options.
   * @returns paginated programs summary.
   */
  async getProgramsSummaryByLocationId(
    locationId: number,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<EducationProgramsSummaryAPIOutDTO>> {
    const url =
      `education-program/location/${locationId}/summary?` +
      getPaginationQueryString(paginationOptions);
    return this.getCallTyped<
      PaginatedResultsAPIOutDTO<EducationProgramsSummaryAPIOutDTO>
    >(this.addClientRoot(url));
  }

  /**
   * Get the programs summary for a particular institution with pagination.
   * @param institutionId id of the institution.
   * @param paginationOptions pagination options.
   * @returns paginated programs summary.
   */
  async getProgramsSummaryByInstitutionId(
    institutionId: number,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<EducationProgramsSummaryAPIOutDTO>> {
    console.log(paginationOptions);
    const url =
      `education-program/institution/${institutionId}/summary?` +
      getPaginationQueryString(paginationOptions);
    return this.getCallTyped<
      PaginatedResultsAPIOutDTO<EducationProgramsSummaryAPIOutDTO>
    >(this.addClientRoot(url));
  }

  /**
   * Get complete program information for a program id.
   * @param programId program id
   * @returns program information.
   */
  async getEducationProgram(
    programId: number,
  ): Promise<EducationProgramAPIOutDTO | AESTEducationProgramAPIOutDTO> {
    return this.getCallTyped<
      EducationProgramAPIOutDTO | AESTEducationProgramAPIOutDTO
    >(this.addClientRoot(`education-program/${programId}`));
  }

  async createEducationProgram(
    payload: EducationProgramAPIInDTO,
  ): Promise<void> {
    await this.postCall("education-program", payload);
  }

  async updateProgram(
    programId: number,
    payload: EducationProgramAPIInDTO,
  ): Promise<void> {
    await this.putCall(`education-program/${programId}`, payload);
  }

  /**
   * Returns the education program for a student.
   * @param programId program id to be returned.
   * @returns education program for a student.
   */
  async getStudentEducationProgram(
    programId: number,
  ): Promise<StudentEducationProgramAPIOutDTO> {
    return this.getCallTyped(
      this.addClientRoot(`education-program/${programId}`),
    );
  }

  /**
   * Gets location programs option list authorized for students.
   * @param locationId location id.
   * @returns location programs option list.
   */
  async getLocationProgramsOptionList(
    locationId: number,
    programYearId: number,
    isIncludeInActiveProgramYear?: boolean,
  ): Promise<OptionItemDto[]> {
    try {
      let url = `institution/education-program/location/${locationId}/program-year/${programYearId}/options-list`;
      if (isIncludeInActiveProgramYear) {
        url = `${url}?isIncludeInActiveProgramYear=${isIncludeInActiveProgramYear}`;
      }
      const response = await this.getCall(url);
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * Gets location programs list authorized for institutions.
   * @returns location programs list for institutions.
   */
  async getProgramsListForInstitutions(): Promise<OptionItemDto[]> {
    try {
      const response = await this.apiClient.get(
        "institution/education-program/programs-list",
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * Ministry user approve's a pending program.
   * @param programId program id.
   * @param institutionId institution id.
   * @param payload ApproveProgram.
   */
  async approveProgram(
    programId: number,
    institutionId: number,
    payload: ApproveProgram,
  ): Promise<void> {
    await this.patchCall(
      `institution/education-program/${programId}/institution/${institutionId}/approve/aest`,
      payload,
    );
  }

  /**
   * Ministry user decline's a pending program.
   * @param programId program id.
   * @param institutionId institution id.
   * @param payload DeclineProgram.
   */
  async declineProgram(
    programId: number,
    institutionId: number,
    payload: DeclineProgram,
  ): Promise<void> {
    await this.patchCall(
      `institution/education-program/${programId}/institution/${institutionId}/decline/aest`,
      payload,
    );
  }
}
