import { Injectable } from "@nestjs/common";
import { DataSource, Raw } from "typeorm";
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
   * Get SFAS student, if available.
   * @param lastName student last name.
   * @param birthDate student data of birth.
   * @param sin student Social Insurance Number.
   * @returns SFAS Student.
   */
  async getIndividualStudent(
    lastName: string,
    birthDate: string,
    sin: string,
  ): Promise<SFASIndividual> {
    const individual = await this.repo
      .createQueryBuilder("individual")
      .select("individual.pdStatus")
      .where("lower(individual.lastName) = :lastName", {
        lastName: lastName.toLowerCase(),
      })
      .andWhere("individual.sin = :sin", { sin })
      .andWhere("individual.birthDate = :birthDate", { birthDate })
      .getOne();

    return individual;
  }

  /**
   * Search for a record in SFAS table using student details.
   * @param lastName student's last name.
   * @param birthDate student's birth date.
   * @param sin student's sin.
   * @returns SFAS individual details.
   */
  async getSFASOverawards(
    lastName: string,
    birthDate: string,
    sin: string,
  ): Promise<SFASIndividual> {
    return await this.repo.findOne({
      select: {
        id: true,
        cslOveraward: true,
        bcslOveraward: true,
      },
      where: {
        lastName: Raw((alias) => `LOWER(${alias}) = LOWER(:lastName)`, {
          lastName,
        }),
        sin: sin,
        birthDate: birthDate,
      },
    });
  }
}
