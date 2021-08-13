import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import { ProgramYear } from "../../database/entities/program-year.model";

@Injectable()
export class ProgramYearService extends RecordDataModelService<ProgramYear> {
  constructor(@Inject("Connection") private readonly connection: Connection) {
    super(connection.getRepository(ProgramYear));
  }

  async getProgramYears(): Promise<ProgramYear[]> {
    return this.repo
      .createQueryBuilder("programYear")
      .where("programYear.is_active = true")
      .orderBy("programYear.id", "DESC")
      .getMany();
  }

  /**
   * Validate Program Year of an Application,
   * if the ProgramYear is not active
   *  return null
   * else r
   *  return the ProgramYear row
   * @param selectedForm Selected Form of the application
   */
  async validateProgramYear(selectedForm: string): Promise<ProgramYear> {
    return this.repo
      .createQueryBuilder("programYear")
      .where("programYear.is_active = true")
      .andWhere("programYear.formName  = :selectedForm", { selectedForm })
      .getOne();
  }
}
