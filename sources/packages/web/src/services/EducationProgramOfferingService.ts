import ApiClient from "./http/ApiClient";

export class EducationProgramOfferingService {
  // Share Instance
  private static instance: EducationProgramOfferingService;

  public static get shared(): EducationProgramOfferingService {
    return this.instance || (this.instance = new this());
  }

  public async createProgramOffering(
    locationId: number,
    programId: number,
    data: any,
  ): Promise<void> {
    await ApiClient.EducationProgramOffering.createProgramOffering(
      locationId,
      programId,
      data,
    );
  }
}
