import {
  EducationProgramDto,
  OptionItemDto,
  StudentEducationProgramDto,
  ProgramDto,
  EducationProgramData
} from "../types";
import ApiClient from "./http/ApiClient";

export class EducationProgramService {
  // Share Instance
  private static instance: EducationProgramService;

  public static get shared(): EducationProgramService {
    return this.instance || (this.instance = new this());
  }

  public async getProgram(programId: number): Promise<ProgramDto> {
    return ApiClient.EducationProgram.getProgram(programId);
  }

  public async createProgram(data: ProgramDto): Promise<void> {
    await ApiClient.EducationProgram.createProgram(data);
  }

  public async updateProgram(
    programId: number,
    data: ProgramDto,
  ): Promise<void> {
    await ApiClient.EducationProgram.updateProgram(programId, data);
  }

  public async getLocationProgramsSummary(locationId: number): Promise<any> {
    return ApiClient.EducationProgram.getLocationProgramsSummary(locationId);
  }

  public async getEducationProgram(
    programId: number,
  ): Promise<EducationProgramDto> {
    return ApiClient.EducationProgram.getEducationProgram(programId);
  }

  public async getStudentEducationProgram(
    programId: number,
  ): Promise<StudentEducationProgramDto> {
    return ApiClient.EducationProgram.getStudentEducationProgram(programId);
  }

  /**
   * Gets location programs option list authorized for students.
   * @param locationId location id.
   * @returns location programs option list.
   */
  public async getLocationProgramsOptionList(
    locationId: number,
    programYearId: number,
    includeInActivePY?: boolean,
  ): Promise<OptionItemDto[]> {
    return ApiClient.EducationProgram.getLocationProgramsOptionList(
      locationId,
      programYearId,
      includeInActivePY,
    );
  }

  /**
   * Gets location programs list authorized for institutions.
   * @returns location programs list for institutions.
   */
  public async getProgramsListForInstitutions(): Promise<OptionItemDto[]> {
    return ApiClient.EducationProgram.getProgramsListForInstitutions();
  }

  /**
   * Education Program Details for ministry users
   * @param programId program id
   * @returns Education Program Details
   */
  public async getEducationProgramForAEST(
    programId: number,
  ): Promise<EducationProgramData> {
    return ApiClient.EducationProgram.getEducationProgramForAEST(programId);
  }
}
