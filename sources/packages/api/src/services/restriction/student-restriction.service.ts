import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { StudentRestriction, RestrictionType } from "../../database/entities";
import { StudentRestrictionStatus } from "./models/student-restriction.model";
import {
  RESTRICTION_FEDERAL_MESSAGE,
  RESTRICTION_PROVINCIAL_MESSAGE,
} from "../../utilities";
import { Connection } from "typeorm";

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
      .addSelect("restrictions.restrictionType", "studentRestrictionStatus")
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
      .addGroupBy("restrictions.allowedCount")
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
    const hasFederalRestriction =
      result.filter(
        (item) =>
          item.studentRestrictionStatus === RestrictionType.Federal.toString(),
      ).length > 0;

    const hasProvincialRestriction =
      result.filter(
        (item) =>
          item.studentRestrictionStatus ===
          RestrictionType.Provincial.toString(),
      ).length > 0;

    if (hasFederalRestriction) {
      restrictionMessage = restrictionMessage
        ? restrictionMessage + " " + RESTRICTION_FEDERAL_MESSAGE
        : RESTRICTION_FEDERAL_MESSAGE;
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
}
