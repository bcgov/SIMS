import { Injectable } from "@nestjs/common";
import { Raw, Repository } from "typeorm";
import { DataModelService, SFASIndividual, Student } from "@sims/sims-db";
import { SFASIndividualDataSummary } from "./sfas-individual.model";
import { InjectRepository } from "@nestjs/typeorm";

/**
 * Manages the data related to an individual/student in SFAS.
 */
@Injectable()
export class SFASIndividualService extends DataModelService<SFASIndividual> {
  constructor(
    @InjectRepository(SFASIndividual)
    sfasIndividualRepo: Repository<SFASIndividual>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {
    super(sfasIndividualRepo);
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

  /**
   * Gets the total number of unsuccessful completion weeks for a student in SFAS.
   * @param studentId student id to retrieve the unsuccessful weeks.
   * @returns total number of unsuccessful completion weeks for a student in SFAS.
   */
  async getSFASTotalUnsuccessfulCompletionWeeks(
    studentId: number,
  ): Promise<number | null> {
    const studentData = await this.studentRepo.findOne({
      select: {
        id: true,
        birthDate: true,
        sinValidation: { sin: true },
        user: { lastName: true },
      },
      relations: {
        sinValidation: true,
        user: true,
      },
      where: {
        id: studentId,
      },
    });
    const sin = studentData.sinValidation.sin;
    const birthDate = studentData.birthDate;
    const lastName = studentData.user.lastName;
    const sfasIndividualData = await this.repo
      .createQueryBuilder("sfasIndividual")
      .select(
        "SUM(sfasIndividual.unsuccessfulCompletion)",
        "totalUnsuccessfulWeeks",
      )
      .where("sin = :sin", { sin })
      .andWhere("birth_date = :birthDate", { birthDate })
      .andWhere("LOWER(last_name) = LOWER(:lastName)", { lastName })
      .getRawOne<SFASIndividualDataSummary>();
    return sfasIndividualData?.totalUnsuccessfulWeeks;
  }
}
