import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { StudentRestriction } from "../../database/entities";
import { Connection } from "typeorm";

/**
 * Service layer for Student Restriction
 */
@Injectable()
export class StudentRestrictionService extends RecordDataModelService<StudentRestriction> {
  constructor(@Inject("Connection") private readonly connection: Connection) {
    super(connection.getRepository(StudentRestriction));
  }

  /**
   * Get the student restriction by primary key.
   * @param id Restriction id.
   * @returns StudentRestriction retrieved, if found, otherwise returns null.
   */
  async getById(id: number): Promise<StudentRestriction> {
    return this.repo.findOne(id);
  }

  async getStudentRestrictionsByUserName(userId: number): Promise<any[]> {
    return this.repo
      .createQueryBuilder("studentRestrictions")
      .select("restrictions.id as restrictionid")
      .addSelect("restrictions.restrictionType as restictiontype")
      .addSelect("count(*) restrctioncount")
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
  }
}
