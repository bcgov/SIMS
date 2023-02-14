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
    const individual = await this.repo.findOne({
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

    return individual;
  }
}
