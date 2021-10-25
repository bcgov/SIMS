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

  async getStudentRestrictionsByUserName(
    userName: string,
  ): Promise<StudentRestriction[]> {
    return this.repo
      .createQueryBuilder("studentRestriction")
      .leftJoinAndSelect("studentRestriction.student", "student")
      .leftJoinAndSelect("studentRestriction.application", "application")
      .leftJoinAndSelect("studentRestriction.restriction", "restriction")
      .leftJoin("student.user", "user")
      .where("user.userName = :userName", { userName })
      .andWhere("studentRestriction.isActive = :isActive", { isActive: true })
      .getMany();
  }
}
