import ApiClient from "./http/ApiClient";
import { CreateEducationProgramDto } from "../types";

export class EducationProgramService {
  // Share Instance
  private static instance: EducationProgramService;

  public static get shared(): EducationProgramService {
    return this.instance || (this.instance = new this());
  }

  public async createProgram(data: CreateEducationProgramDto): Promise<void> {
    await ApiClient.EducationProgram.createProgram(data);
  }
}
