import { Injectable } from "@nestjs/common";
import { Brackets, DataSource, IsNull, Repository } from "typeorm";
import { NoteType, SFASIndividual, SFASRestriction } from "@sims/sims-db";
import { SFASIndividualDataSummary } from "./sfas-individual.model";
import { InjectRepository } from "@nestjs/typeorm";
import { NoteSharedService } from "@sims/services";

/**
 * Manages the data related to an individual/student in SFAS.
 */
@Injectable()
export class SFASIndividualService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(SFASIndividual)
    private readonly sfasIndividualRepo: Repository<SFASIndividual>,
    private readonly noteSharedService: NoteSharedService,
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
      .select([
        "individual.id",
        "individual.pdStatus",
        "individual.ppdStatus",
        "individual.ppdStatusDate",
      ])
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
    return this.sfasIndividualRepo
      .createQueryBuilder("individual")
      .select([
        "individual.id",
        "individual.lastName",
        "individual.sin",
        "individual.birthDate",
      ])
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
  }

  /**
   * Get students that could potentially be associated with the given student.
   * @param lastName student last name, must be an exact match.
   * @param birthDate student date of birth.
   * @param sin student social insurance number.
   * @returns SFAS students that could be potentially associated to a SIMS student.
   */
  async getIndividualStudentPartialMatchForAssociation(
    lastName: string,
    birthDate: string,
    sin: string,
  ): Promise<SFASIndividual[]> {
    return this.sfasIndividualRepo
      .createQueryBuilder("individual")
      .select([
        "individual.id",
        "individual.firstName",
        "individual.lastName",
        "individual.sin",
        "individual.birthDate",
      ])
      .where("individual.student.id IS NULL")
      .andWhere(
        new Brackets((qb) =>
          qb.where("individual.sin = :sin", { sin }).orWhere(
            new Brackets((qb) => {
              qb.where("lower(individual.lastName) = :lastName", {
                lastName: lastName.toLowerCase(),
              }).andWhere("individual.birthDate = :birthDate", {
                birthDate,
              });
            }),
          ),
        ),
      )
      .getMany();
  }

  /**
   * Associate a student to a legacy profile and reset the restrictions
   * to allow them to be reprocessed and associated with the new student.
   * @param individualId legacy individual to have the student associated.
   * @param studentId student to be associated to the legacy profile.
   */
  async associateStudentProfile(
    individualId: number,
    studentId: number,
    noteDescription: string,
    auditUserId: number,
  ): Promise<void> {
    await this.dataSource.transaction(async (entityManager) => {
      const updateResult = await entityManager
        .getRepository(SFASIndividual)
        .update(
          { id: individualId, student: IsNull() },
          { student: { id: studentId } },
        );
      if (!updateResult.affected) {
        throw new Error(
          `Error while associating student ID ${studentId} to legacy individual ID ${individualId}. The individual was not found or a student ID is already associated with it.`,
        );
      }
      const updateRestrictions = entityManager
        .getRepository(SFASRestriction)
        .update({ individualId, processed: true }, { processed: false });
      const createNotePromise = this.noteSharedService.createStudentNote(
        studentId,
        NoteType.General,
        noteDescription,
        auditUserId,
        entityManager,
      );
      await Promise.all([updateRestrictions, createNotePromise]);
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
    const sfasIndividualData = await this.sfasIndividualRepo
      .createQueryBuilder("sfasIndividual")
      .select(
        "SUM(sfasIndividual.unsuccessfulCompletion)::int",
        "totalUnsuccessfulWeeks",
      )
      .where("sfasIndividual.student.id = :studentId", { studentId })
      .getRawOne<SFASIndividualDataSummary>();
    return sfasIndividualData?.totalUnsuccessfulWeeks;
  }
}
