import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RecordDataModelService, ProgramYear } from "@sims/sims-db";

@Injectable()
export class ProgramYearService extends RecordDataModelService<ProgramYear> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(ProgramYear));
  }

  /**
   * Get all active the program years information.
   * @returns active program years ordered by name in descendent order.
   */
  async getProgramYears(): Promise<ProgramYear[]> {
    return this.repo.find({
      select: {
        id: true,
        programYear: true,
        programYearDesc: true,
        offeringIntensity: true,
      },
      where: { active: true },
      order: { programYear: "DESC" },
    });
  }

  /**
   * Checks for the existence of the provided program year.
   * @param id program year id to validate.
   * @returns boolean indicating true if the programYear exists, false otherwise.
   */
  async programYearExists(id: number): Promise<boolean> {
    return this.repo.exists({ where: { id, active: true } });
  }

  /**
   * Get a program year.
   * @param programYearId program year id.
   * @param options options.
   * - `active` when provided, filters the program year by its active status.
   * @returns program year.
   */
  async getProgramYear(
    programYearId: number,
    options?: { active?: boolean },
  ): Promise<ProgramYear> {
    return this.repo.findOne({
      select: {
        id: true,
        offeringIntensity: true,
        startDate: true,
      },
      where: { id: programYearId, active: options?.active },
    });
  }
}
