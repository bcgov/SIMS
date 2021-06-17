import ApiClient from "./http/ApiClient";
import { Offering } from "../types/contracts/OfferingContact";
import { EducationProgramOfferingDto } from "../types";

export class EducationProgramOfferingService {
  // Share Instance
  private static instance: EducationProgramOfferingService;

  public static get shared(): EducationProgramOfferingService {
    return this.instance || (this.instance = new this());
  }

  public async createProgramOffering(
    locationId: number,
    programId: number,
    data: Offering,
  ): Promise<void> {
    await ApiClient.EducationProgramOffering.createProgramOffering(
      locationId,
      programId,
      data,
    );
  }

  public async getAllEducationProgramOffering(
    locationId: number,
    programId: number,
  ): Promise<EducationProgramOfferingDto[]> {
    return ApiClient.EducationProgramOffering.getAllEducationProgramOffering(
      locationId,
      programId,
    );
  }
}
