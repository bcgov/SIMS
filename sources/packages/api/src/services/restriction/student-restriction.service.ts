import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  StudentRestriction,
  RestrictionType,
  Note,
  NoteType,
  User,
} from "../../database/entities";
import { StudentRestrictionStatus } from "./models/student-restriction.model";
import {
  RESTRICTION_FEDERAL_MESSAGE,
  RESTRICTION_PROVINCIAL_MESSAGE,
} from "./constants";
import { Connection, SelectQueryBuilder } from "typeorm";
import { CustomNamedError } from "../../utilities";
export const RESTRICTION_NOT_ACTIVE = "RESTRICTION_NOT_ACTIVE";
export const RESTRICTION_NOT_PROVINCIAL = "RESTRICTION_NOT_PROVINCIAL";

/**
 * Service layer for Student Restriction.
 */
@Injectable()
export class StudentRestrictionService extends RecordDataModelService<StudentRestriction> {
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(StudentRestriction));
  }

  /**
   * Retrieves the student restrictions as raw data.
   * It uses group by to get the count of a restriction for a user.
   * This count is to validate against allowed count.
   * @param userId
   * @returns Student restriction raw data.
   */
  async getStudentRestrictionsByUserId(
    userId: number,
  ): Promise<StudentRestrictionStatus> {
    const result = await this.repo
      .createQueryBuilder("studentRestrictions")
      .select("restrictions.id", "restrictionId")
      .addSelect("restrictions.restrictionType", "restrictionType")
      .addSelect("count(*)", "restrictionCount")
      .innerJoin("studentRestrictions.restriction", "restrictions")
      .innerJoin("studentRestrictions.student", "student")
      .innerJoin("student.user", "user")
      .where("studentRestrictions.isActive = true")
      .andWhere("user.id= :userId", {
        userId,
      })
      .groupBy("studentRestrictions.student.id")
      .addGroupBy("restrictions.id")
      .addGroupBy("restrictions.restrictionType")
      .having("count(*) > restrictions.allowedCount")
      .getRawMany();

    if (!result || result.length === 0) {
      return {
        hasRestriction: false,
        hasFederalRestriction: false,
        hasProvincialRestriction: false,
        restrictionMessage: null,
      } as StudentRestrictionStatus;
    }
    let restrictionMessage: string = null;
    const hasFederalRestriction = result.some(
      (item) => item.restrictionType === RestrictionType.Federal.toString(),
    );

    const hasProvincialRestriction = result.some(
      (item) => item.restrictionType === RestrictionType.Provincial.toString(),
    );

    if (hasFederalRestriction) {
      restrictionMessage = RESTRICTION_FEDERAL_MESSAGE;
    }

    if (hasProvincialRestriction) {
      restrictionMessage = restrictionMessage
        ? restrictionMessage + " " + RESTRICTION_PROVINCIAL_MESSAGE
        : RESTRICTION_PROVINCIAL_MESSAGE;
    }

    return {
      hasRestriction: true,
      hasFederalRestriction: hasFederalRestriction,
      hasProvincialRestriction: hasProvincialRestriction,
      restrictionMessage: restrictionMessage,
    } as StudentRestrictionStatus;
  }

  /**
   * Creates a 'select' query that could be used in an 'exists' or
   * 'not exists' where clause to define if the student has some
   * active restrictions that must prevent him for certain
   * critical operations, for instance, to have money disbursed.
   * ! This query will assume that a join to 'student.id' is present
   * ! in the master query.
   * @returns 'select' query that could be used in an 'exists' or
   * 'not exists'.
   */
  getExistsBlockRestrictionQuery(): SelectQueryBuilder<StudentRestriction> {
    return this.repo
      .createQueryBuilder("studentRestrictions")
      .select("1")
      .innerJoin("studentRestrictions.restriction", "restrictions")
      .innerJoin("studentRestrictions.student", "restrictionStudent")
      .where("studentRestrictions.isActive = true")
      .andWhere("restrictionStudent.id = student.id")
      .groupBy("studentRestrictions.student.id")
      .addGroupBy("restrictions.id")
      .having("count(*) > restrictions.allowedCount");
  }

  /**
   * Service method to get all restrictions as a summary for a student.
   * @param studentId
   * @returns Student restrictions.
   */
  async getStudentRestrictionsById(
    studentId: number,
  ): Promise<StudentRestriction[]> {
    return this.repo
      .createQueryBuilder("studentRestrictions")
      .select([
        "studentRestrictions.id",
        "studentRestrictions.isActive",
        "studentRestrictions.updatedAt",
        "studentRestrictions.createdAt",
        "restriction.restrictionType",
        "restriction.restrictionCategory",
        "restriction.description",
      ])
      .innerJoin("studentRestrictions.restriction", "restriction")
      .innerJoin("studentRestrictions.student", "student")
      .where("student.id = :studentId", { studentId })
      .orderBy("studentRestrictions.isActive", "DESC")
      .getMany();
  }

  /**
   * Get student restriction detail.
   * @param studentId
   * @param restrictionId
   * @returns
   */
  async getStudentRestrictionDetailsById(
    studentId: number,
    studentRestrictionId: number,
  ): Promise<StudentRestriction> {
    return this.repo
      .createQueryBuilder("studentRestrictions")
      .select([
        "studentRestrictions.id",
        "studentRestrictions.isActive",
        "studentRestrictions.updatedAt",
        "studentRestrictions.createdAt",
        "creator.firstName",
        "creator.lastName",
        "modifier.firstName",
        "modifier.lastName",
        "restriction.restrictionType",
        "restriction.restrictionCategory",
        "restriction.description",
        "restrictionNote.description",
        "resolutionNote.description",
      ])
      .innerJoin("studentRestrictions.restriction", "restriction")
      .innerJoin("studentRestrictions.creator", "creator")
      .leftJoin("studentRestrictions.modifier", "modifier")
      .innerJoin("studentRestrictions.student", "student")
      .leftJoin("studentRestrictions.restrictionNote", "restrictionNote")
      .leftJoin("studentRestrictions.resolutionNote", "resolutionNote")
      .where("student.id = :studentId", { studentId })
      .andWhere("studentRestrictions.id = :studentRestrictionId", {
        studentRestrictionId,
      })
      .getOne();
  }

  /**
   * Add provincial restriction to student.
   * @param studentRestriction
   * @returns persisted student restriction.
   */
  async addProvincialRestriction(
    studentRestriction: StudentRestriction,
  ): Promise<StudentRestriction> {
    const studentRestrictionEntity = new StudentRestriction();
    studentRestrictionEntity.creator = studentRestriction.creator;
    studentRestrictionEntity.student = studentRestriction.student;
    studentRestrictionEntity.restriction = studentRestriction.restriction;
    studentRestrictionEntity.restrictionNote =
      studentRestriction.restrictionNote;
    return this.repo.save(studentRestrictionEntity);
  }

  /**
   * Resolve provincial restriction.
   * @param studentRestriction
   * @returns resolved student restriction.
   */
  async resolveProvincialRestriction(
    studentRestriction: StudentRestriction,
  ): Promise<StudentRestriction> {
    const studentRestrictionEntity = await this.repo.findOne(
      {
        id: studentRestriction.id,
        student: studentRestriction.student,
        isActive: true,
      },
      {
        relations: ["resolutionNote", "modifier", "restriction"],
      },
    );

    if (!studentRestrictionEntity) {
      throw new CustomNamedError(
        "The restriction neither assigned to student nor active. Only active restrictions can be resolved.",
        RESTRICTION_NOT_ACTIVE,
      );
    }

    if (
      studentRestrictionEntity.restriction.restrictionType !==
      RestrictionType.Provincial
    ) {
      throw new CustomNamedError(
        "The given restriction type is not Provincial. Only provincial restrictions can be resolved by application user.",
        RESTRICTION_NOT_PROVINCIAL,
      );
    }
    studentRestrictionEntity.isActive = false;
    studentRestrictionEntity.modifier = studentRestriction.modifier;
    studentRestrictionEntity.resolutionNote = {
      description: studentRestriction.resolutionNote.description,
      noteType: NoteType.Restriction,
      creator: {
        id: studentRestriction.modifier.id,
      } as User,
    } as Note;
    return this.repo.save(studentRestrictionEntity);
  }
}
