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
   * @param id program year id to check for existence.
   * @param options options.
   * - `activeOnly` when true, only active program years are considered.
   * When false, the program year active status is not considered. Default is true.
   * @returns boolean indicating true if the programYear exists, false otherwise.
   */
  async programYearExists(
    id: number,
    options?: { activeOnly?: boolean },
  ): Promise<boolean> {
    const activeOnly = options?.activeOnly ?? true;
    return this.repo.exists({
      where: { id, active: activeOnly ? true : undefined },
    });
  }

  /**
   * Get an active program year.
   * @param programYearId program year id.
   * @returns active program year.
   */
  getProgramYear(programYearId: number): Promise<ProgramYear> {
    return this.repo.findOne({
      select: {
        id: true,
        offeringIntensity: true,
        startDate: true,
      },
      where: { id: programYearId, active: true },
    });
  }
}
