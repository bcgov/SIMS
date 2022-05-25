import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  StudentRestriction,
  RestrictionType,
  Note,
  NoteType,
  User,
  Restriction,
  Student,
} from "../../database/entities";
import { StudentRestrictionStatus } from "./models/student-restriction.model";
import {
  AssignRestrictionDTO,
  ResolveRestrictionDTO,
} from "../../route-controllers/restriction/models/restriction.dto";
import {
  RESTRICTION_FEDERAL_MESSAGE,
  RESTRICTION_PROVINCIAL_MESSAGE,
} from "./constants";
import { Connection, SelectQueryBuilder } from "typeorm";
import { CustomNamedError } from "../../utilities";
import { RestrictionActionType } from "../../database/entities/restriction-action-type.type";
export const RESTRICTION_NOT_ACTIVE = "RESTRICTION_NOT_ACTIVE";
export const RESTRICTION_NOT_PROVINCIAL = "RESTRICTION_NOT_PROVINCIAL";

/**
 * Service layer for Student Restriction.
 */
@Injectable()
export class StudentRestrictionService extends RecordDataModelService<StudentRestriction> {
  constructor(connection: Connection) {
    super(connection.getRepository(StudentRestriction));
  }

  /**
   * Creates a 'select' query that could be used in an 'exists' or
   * 'not exists' where clause to define if the student has some
   * active restrictions that must prevent him for certain
   * critical operations, for instance, to have money disbursed.
   * ! This query will assume that a join to 'student.id' is present
   * ! in the master query.
   * @param restrictionActions list of restriction actions that needed to be checked.
   * @param checkAll, is by default false, checkAll decides if the all the
   * elements in the restrictionActions should be checked (i.e checkAll = true)
   * or any one of the element is to be checked (i.e checkAll = false).
   * @returns 'select' query that could be used in an 'exists' or
   * 'not exists'.
   * TODO: TEST ECERT FILE ANN
   */
  getExistsBlockRestrictionQuery(
    restrictionActions: RestrictionActionType[],
    checkAll = false,
  ): SelectQueryBuilder<StudentRestriction> {
    console.log("++++++++++++", restrictionActions);
    const query = this.repo
      .createQueryBuilder("studentRestrictions")
      .select("1")
      .innerJoin("studentRestrictions.restriction", "restrictions")
      .innerJoin("studentRestrictions.student", "restrictionStudent")
      .where("studentRestrictions.isActive = true")
      .andWhere("restrictionStudent.id = student.id");
    if (checkAll) {
      query.andWhere(
        `restrictions.actionType @> ARRAY ${JSON.stringify(restrictionActions)
          .replace('"', "'")
          .replace('"', "'")} :: sims.restriction_action_types []`,
      );
    } else {
      query.andWhere(
        `restrictions.actionType && ARRAY ${JSON.stringify(restrictionActions)
          .replace('"', "'")
          .replace('"', "'")} :: sims.restriction_action_types []`,
      );
    }
    console.log(query, "++++++++++++query", restrictionActions);
    return query
      .groupBy("studentRestrictions.student.id")
      .addGroupBy("restrictions.id");
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
        "restriction.restrictionCode",
        "restriction.description",
        "restriction.notificationType",
      ])
      .innerJoin("studentRestrictions.restriction", "restriction")
      .innerJoin("studentRestrictions.student", "student")
      .where("student.id = :studentId", { studentId })
      .orderBy("studentRestrictions.isActive", "DESC")
      .getMany();
  }

  /**
   * Get student restriction detail.
   * @param studentId student id.
   * @param studentRestrictionId is optional.
   * @returns Student Restriction details.
   */
  async getStudentRestrictionDetailsById(
    studentId: number,
    studentRestrictionId?: number,
  ): Promise<StudentRestriction> {
    const query = this.repo
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
        "restriction.restrictionCode",
        "restrictionNote.description",
        "resolutionNote.description",
        "restriction.notificationType",
      ])
      .innerJoin("studentRestrictions.restriction", "restriction")
      .leftJoin("studentRestrictions.creator", "creator")
      .leftJoin("studentRestrictions.modifier", "modifier")
      .innerJoin("studentRestrictions.student", "student")
      .leftJoin("studentRestrictions.restrictionNote", "restrictionNote")
      .leftJoin("studentRestrictions.resolutionNote", "resolutionNote")
      .where("student.id = :studentId", { studentId });
    if (studentRestrictionId) {
      query.andWhere("studentRestrictions.id = :studentRestrictionId", {
        studentRestrictionId,
      });
    }
    return query.getOne();
  }

  /**
   * Add provincial restriction to student.
   * @param studentId
   * @param userId
   * @param addStudentRestrictionDTO
   * @returns persisted student restriction.
   */
  async addProvincialRestriction(
    studentId: number,
    userId: number,
    addStudentRestrictionDTO: AssignRestrictionDTO,
  ): Promise<StudentRestriction> {
    const studentRestriction = new StudentRestriction();
    studentRestriction.student = { id: studentId } as Student;
    studentRestriction.restriction = {
      id: addStudentRestrictionDTO.restrictionId,
    } as Restriction;
    studentRestriction.creator = { id: userId } as User;
    if (addStudentRestrictionDTO.noteDescription) {
      studentRestriction.restrictionNote = {
        description: addStudentRestrictionDTO.noteDescription,
        noteType: NoteType.Restriction,
        creator: {
          id: studentRestriction.creator.id,
        } as User,
      } as Note;
    }
    return this.repo.save(studentRestriction);
  }

  /**
   * Resolve provincial restriction.
   * @param studentId
   * @param studentRestrictionId
   * @param userId
   * @param updateRestrictionDTO
   * @returns resolved student restriction.
   */
  async resolveProvincialRestriction(
    studentId: number,
    studentRestrictionId: number,
    userId: number,
    updateRestrictionDTO: ResolveRestrictionDTO,
  ): Promise<StudentRestriction> {
    const studentRestrictionEntity = await this.repo.findOne(
      {
        id: studentRestrictionId,
        student: { id: studentId } as Student,
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
    studentRestrictionEntity.modifier = { id: userId } as User;
    studentRestrictionEntity.resolutionNote = {
      description: updateRestrictionDTO.noteDescription,
      noteType: NoteType.Restriction,
      creator: {
        id: studentRestrictionEntity.modifier.id,
      } as User,
    } as Note;
    return this.repo.save(studentRestrictionEntity);
  }
  /**
   * The service function checks if the requested student has
   * the restricted restriction.
   * @param studentId student Id
   * @param restrictionActions list of restriction actions
   * @param checkAll,is by default false, checkAll decides if the all the
   * elements in the restrictionActions should be checked (i.e checkAll = true)
   * or any one of the element is to be checked (i.e checkAll = false).
   * @returns boolean, true if the restriction action is present
   * for the student, else false.
   */
  async isRestrictionActionExists(
    studentId: number,
    restrictionActions: RestrictionActionType[],
    checkAll = false,
  ): Promise<boolean> {
    const query = this.repo
      .createQueryBuilder("studentRestrictions")
      .select("1")
      .innerJoin("studentRestrictions.restriction", "restrictions")
      .innerJoin("studentRestrictions.student", "student")
      .where("studentRestrictions.isActive = true")
      .andWhere("student.id= :studentId", {
        studentId,
      });
    if (checkAll) {
      query.andWhere("restrictions.actionType @> :restrictionActions", {
        restrictionActions,
      });
    } else {
      query.andWhere("restrictions.actionType && :restrictionActions", {
        restrictionActions,
      });
    }
    console.log(query.getQueryAndParameters());
    return (await query.getRawMany()).length > 0;
  }
}
