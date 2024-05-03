import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RecordDataModelService, ProgramYear } from "@sims/sims-db";

@Injectable()
export class ProgramYearService extends RecordDataModelService<ProgramYear> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(ProgramYear));
  }

  /***
   * Get all active the program years information.
   * @returns active program years ordered by name in descendent order.
   */
  async getProgramYears(): Promise<ProgramYear[]> {
    return this.repo.find({
      select: {
        programYear: true,
        programYearDesc: true,
      },
      where: { active: true },
      order: { programYear: "DESC" },
    });
  }

  /**
   * Get the Program Year of an Application,
   * if the ProgramYear is not active
   *  return null
   * else
   *  return the ProgramYear row
   * @param programYearId Selected Form ProgramYear of the application
   */
  async getActiveProgramYear(programYearId: number): Promise<ProgramYear> {
    return this.repo
      .createQueryBuilder("programYear")
      .where("programYear.is_active = true")
      .andWhere("programYear.id  = :programYearId", { programYearId })
      .getOne();
  }
}
