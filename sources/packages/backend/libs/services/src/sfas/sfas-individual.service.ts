import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { DataModelService, SFASIndividual } from "@sims/sims-db";
/**
 * Manages the data related to an individual/student in SFAS.
 */
@Injectable()
export class SFASIndividualService extends DataModelService<SFASIndividual> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(SFASIndividual));
  }

  /**
   * Get the permanent disability status from SFAS, if available.
   * @param lastName student last name.
   * @param birthDate student data of birth.
   * @param sin student Social Insurance Number.
   * @returns the permanent disability if present or null. Even when
   * the record is present os SFAS, the value could still be null,
   * what means that a permanent disability verification was never
   * executed for the student.
   */
  async getPDStatus(
    lastName: string,
    birthDate: string,
    sin: string,
  ): Promise<boolean | null> {
    const individual = await this.repo
      .createQueryBuilder("individual")
      .select("individual.pdStatus")
      .where("lower(individual.lastName) = :lastName", {
        lastName: lastName.toLowerCase(),
      })
      .andWhere("individual.sin = :sin", { sin })
      .andWhere("individual.birthDate = :birthDate", { birthDate })
      .getOne();

    return individual?.pdStatus;
  }
}
