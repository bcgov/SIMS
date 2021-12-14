import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { StudentRestriction, RestrictionType } from "../../database/entities";
import { StudentRestrictionStatus } from "./models/student-restriction.model";
import {
  RESTRICTION_FEDERAL_MESSAGE,
  RESTRICTION_PROVINCIAL_MESSAGE,
} from "./constants";
import { Connection, SelectQueryBuilder } from "typeorm";

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
        "studentRestrictions.isActive",
        "studentRestrictions.updatedAt",
        "studentRestrictions.createdAt",
        "restriction.restrictionType",
        "restriction.description",
      ])
      .innerJoin("studentRestrictions.restriction", "restriction")
      .innerJoin("studentRestrictions.student", "student")
      .where("student.id = :studentId", { studentId })
      .getMany();
  }
}
