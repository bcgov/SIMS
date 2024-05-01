import { Injectable } from "@nestjs/common";
import { Brackets, Raw, Repository } from "typeorm";
import { SFASIndividual, Student } from "@sims/sims-db";
import { SFASIndividualDataSummary } from "./sfas-individual.model";
import { InjectRepository } from "@nestjs/typeorm";

/**
 * Manages the data related to an individual/student in SFAS.
 */
@Injectable()
export class SFASIndividualService {
  constructor(
    @InjectRepository(SFASIndividual)
    private readonly sfasIndividualRepo: Repository<SFASIndividual>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

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
    const individual = await this.sfasIndividualRepo
      .createQueryBuilder("individual")
      .select(["individual.id", "individual.pdStatus"])
      .where("lower(individual.lastName) = :lastName", {
        lastName: lastName.toLowerCase(),
      })
      .andWhere("individual.sin = :sin", { sin })
      .andWhere("individual.birthDate = :birthDate", { birthDate })
      .getOne();

    return individual;
  }

  /**
   * Get SFAS student partial match, if available.
   * At least two of the three parameters must match.
   * @param lastName student last name.
   * @param birthDate student data of birth.
   * @param sin student Social Insurance Number.
   * @returns SFAS Student.
   */
  async getIndividualStudentPartialMatch(
    lastName: string,
    birthDate: string,
    sin: string,
  ): Promise<SFASIndividual> {
    const individual = await this.sfasIndividualRepo
      .createQueryBuilder("individual")
      .select(["individual.id", "individual.pdStatus"])
      .where(
        new Brackets((qb) => {
          qb.where("lower(individual.lastName) = :lastName", {
            lastName: lastName.toLowerCase(),
          }).andWhere("individual.sin = :sin", { sin });
        }),
      )
      .orWhere(
        new Brackets((qb) => {
          qb.where("lower(individual.lastName) = :lastName", {
            lastName: lastName.toLowerCase(),
          }).andWhere("individual.birthDate = :birthDate", { birthDate });
        }),
      )
      .orWhere(
        new Brackets((qb) => {
          qb.where("individual.sin = :sin", { sin }).andWhere(
            "individual.birthDate = :birthDate",
            { birthDate },
          );
        }),
      )
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
    return await this.sfasIndividualRepo.findOne({
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
    const sfasIndividualData = await this.sfasIndividualRepo
      .createQueryBuilder("sfasIndividual")
      .select(
        "SUM(sfasIndividual.unsuccessfulCompletion)::int",
        "totalUnsuccessfulWeeks",
      )
      .where("sin = :sin", { sin })
      .andWhere("birth_date = :birthDate", { birthDate })
      .andWhere("LOWER(last_name) = LOWER(:lastName)", { lastName })
      .getRawOne<SFASIndividualDataSummary>();
    return sfasIndividualData?.totalUnsuccessfulWeeks;
  }
}
