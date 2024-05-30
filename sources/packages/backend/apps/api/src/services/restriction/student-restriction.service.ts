import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  StudentRestriction,
  RestrictionType,
  NoteType,
  User,
  Restriction,
  Student,
  EducationProgramOffering,
  RestrictionActionType,
} from "@sims/sims-db";
import { RestrictionNotificationType } from "@sims/sims-db/entities";
import { DataSource, EntityManager } from "typeorm";
import { CustomNamedError } from "@sims/utilities";
import {
  NoteSharedService,
  RestrictionCode,
  StudentRestrictionSharedService,
} from "@sims/services";
export const RESTRICTION_NOT_ACTIVE = "RESTRICTION_NOT_ACTIVE";
export const RESTRICTION_NOT_PROVINCIAL = "RESTRICTION_NOT_PROVINCIAL";

/**
 * Service layer for Student Restriction.
 */
@Injectable()
export class StudentRestrictionService extends RecordDataModelService<StudentRestriction> {
  constructor(
    readonly dataSource: DataSource,
    private readonly noteSharedService: NoteSharedService,
    private readonly studentRestrictionSharedService: StudentRestrictionSharedService,
  ) {
    super(dataSource.getRepository(StudentRestriction));
  }

  /**
   * Service method to get all restrictions as a summary for a student.
   * @param studentId.
   * @param options related to student restrictions.
   * - `filterNoEffectRestrictions` filterNoEffectRestrictions is a flag to filter restrictions based on notificationType.
   * - `onlyActive` onlyActive is a flag, which decides whether to select all
   * restrictions (i.e false) or to select only active restrictions (i.e true).
   * @returns Student restrictions.
   */
  async getStudentRestrictionsById(
    studentId: number,
    options?: {
      filterNoEffectRestrictions?: boolean;
      onlyActive?: boolean;
    },
  ): Promise<StudentRestriction[]> {
    const query = this.repo
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
      .where("student.id = :studentId", { studentId });
    if (options?.onlyActive) {
      query.andWhere("studentRestrictions.isActive = true");
    }
    if (options?.filterNoEffectRestrictions) {
      query.andWhere(
        "restriction.notificationType != :restrictionNotificationType",
        { restrictionNotificationType: RestrictionNotificationType.NoEffect },
      );
    }
    return query
      .orderBy("studentRestrictions.isActive", "DESC")
      .addOrderBy("studentRestrictions.createdAt", "DESC")
      .getMany();
  }

  /**
   * Get student restriction detail.
   * @param studentId student id.
   * @param studentRestrictionId student restriction id.
   * @param options for student restrictions.
   * - `filterNoEffectRestrictions` filterNoEffectRestrictions flag to filter restrictions based on notificationType.
   * @returns Student Restriction details.
   */
  async getStudentRestrictionDetailsById(
    studentId: number,
    studentRestrictionId: number,
    options?: {
      filterNoEffectRestrictions?: boolean;
    },
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
      ])
      .innerJoin("studentRestrictions.restriction", "restriction")
      .leftJoin("studentRestrictions.creator", "creator")
      .leftJoin("studentRestrictions.modifier", "modifier")
      .innerJoin("studentRestrictions.student", "student")
      .leftJoin("studentRestrictions.restrictionNote", "restrictionNote")
      .leftJoin("studentRestrictions.resolutionNote", "resolutionNote")
      .where("student.id = :studentId", { studentId })
      .andWhere("studentRestrictions.id = :studentRestrictionId", {
        studentRestrictionId,
      });
    if (options?.filterNoEffectRestrictions) {
      query.andWhere(
        "restriction.notificationType != :restrictionNotificationType",
        {
          restrictionNotificationType: RestrictionNotificationType.NoEffect,
        },
      );
    }
    return query.getOne();
  }

  /**
   * Add provincial restriction to student.
   * @param studentId student to whom the restriction is added.
   * @param auditUserId user who is adding restriction.
   * @param restrictionId restriction.
   * @param noteDescription notes added on adding restriction.
   * @returns persisted student restriction.
   */
  async addProvincialRestriction(
    studentId: number,
    auditUserId: number,
    restrictionId: number,
    noteDescription: string,
  ): Promise<StudentRestriction> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const note = await this.noteSharedService.createStudentNote(
        studentId,
        NoteType.Restriction,
        noteDescription,
        auditUserId,
        transactionalEntityManager,
      );
      const studentRestriction = new StudentRestriction();
      studentRestriction.student = { id: studentId } as Student;
      studentRestriction.restriction = {
        id: restrictionId,
      } as Restriction;
      studentRestriction.creator = { id: auditUserId } as User;
      studentRestriction.restrictionNote = note;
      const newRestriction = await transactionalEntityManager
        .getRepository(StudentRestriction)
        .save(studentRestriction);
      await this.studentRestrictionSharedService.createNotifications(
        [newRestriction.id],
        auditUserId,
        transactionalEntityManager,
      );
      return studentRestriction;
    });
  }

  /**
   * Resolve provincial restriction.
   * @param studentId Student who's restriction to be resolved.
   * @param studentRestrictionId student restriction.
   * @param userId User who is resolving the restriction.
   * @param noteDescription notes added during the resolution.
   * @returns resolved student restriction.
   */
  async resolveProvincialRestriction(
    studentId: number,
    studentRestrictionId: number,
    userId: number,
    noteDescription: string,
  ): Promise<void> {
    const studentRestrictionEntity = await this.repo.findOne({
      where: {
        id: studentRestrictionId,
        student: { id: studentId },
        isActive: true,
      },
      relations: { restriction: true },
    });

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
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const note = await this.noteSharedService.createStudentNote(
        studentId,
        NoteType.Restriction,
        noteDescription,
        userId,
        transactionalEntityManager,
      );
      const studentRestriction = new StudentRestriction();
      studentRestriction.id = studentRestrictionId;
      studentRestriction.modifier = { id: userId } as User;
      studentRestriction.isActive = false;
      studentRestriction.resolutionNote = note;
      await transactionalEntityManager
        .getRepository(StudentRestriction)
        .save(studentRestriction);
    });
  }

  /**
   * Checks if the requested student has
   * any or all requested restriction actions.
   * @param studentId student Id
   * @param restrictionActions list of restriction actions
   * @param checkAll is by default false, checkAll decides if the all the
   * elements in the restrictionActions should be checked (i.e checkAll = true)
   * or any one of the elements is to be checked (i.e checkAll = false).
   * @returns boolean, true if the restriction action is present
   * for the student, else false.
   */
  async hasRestrictionAction(
    studentId: number,
    restrictionActions: RestrictionActionType[],
    checkAll = false,
  ): Promise<boolean> {
    const query = this.studentRestrictionSharedService
      .getExistsBlockRestrictionQuery(checkAll, true)
      .setParameters({
        studentId,
        restrictionActions,
      });
    return !!(await query.getRawOne());
  }

  /**
   * Checks if the student has an active requested restriction.
   * @param studentId student id.
   * @param restrictionCode restriction code.
   * @returns true, if the student has the requested active
   * restriction code else false.
   */
  async studentHasRestriction(
    studentId: number,
    restrictionCode: string,
  ): Promise<boolean> {
    return !!(await this.repo
      .createQueryBuilder("studentRestrictions")
      .select("studentRestrictions.id")
      .innerJoin("studentRestrictions.restriction", "restriction")
      .innerJoin("studentRestrictions.student", "student")
      .where("student.id = :studentId", { studentId })
      .andWhere("studentRestrictions.isActive = true")
      .andWhere("restriction.restrictionCode = :restrictionCode", {
        restrictionCode,
      })
      .limit(1)
      .getOne());
  }

  /**
   * Verify if the student has a valid SIN to apply to the particular offering.
   * The SIN number must be a permanent one or a temporary with expiry date later
   * then the end date of the offering.
   * Case the SIN is not valid the student can still apply to the offering but a
   * restriction will be created to stop funding to be disbursed till the a valid
   * SIN is provided.
   * @param studentId student to be validate.
   * @param offeringId offering to be verified.
   * @param applicationId related application. Used as additional information case
   * a student restriction will be created.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param entityManager manages the transaction where this operation must be executed.
   */
  async assessSINRestrictionForOfferingId(
    studentId: number,
    offeringId: number,
    applicationId: number,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    const student = await entityManager
      .getRepository(Student)
      .createQueryBuilder("student")
      .select([
        "student.id",
        "sinValidation.id",
        "sinValidation.isValidSIN",
        "sinValidation.temporarySIN",
        "sinValidation.sinExpiryDate",
      ])
      .innerJoin("student.sinValidation", "sinValidation")
      .where("student.id = :studentId", { studentId })
      .getOne();

    if (!student.sinValidation.temporarySIN) {
      // SIN is not temporary so no restriction should be created.
      return;
    }

    const hasSINRestriction = await this.studentHasRestriction(
      studentId,
      RestrictionCode.SINF,
    );
    if (hasSINRestriction) {
      // The student already has an active SIN restriction, avoid adding it again.
      return;
    }

    // By default assume that the temporary SIN does not have an expiry
    // date defined and the restriction must be created.
    let mustCreateSINException = true;
    if (student.sinValidation.sinExpiryDate) {
      // Temporary SIN has an expiry date and it must be validated with the end date of the offering.
      const offering = await entityManager
        .getRepository(EducationProgramOffering)
        .findOne({ where: { id: offeringId }, select: { studyEndDate: true } });
      // Check if the SIN expiry date is later than the offering end date.
      mustCreateSINException =
        new Date(offering.studyEndDate) >
        new Date(student.sinValidation.sinExpiryDate);
    }

    if (mustCreateSINException) {
      const restriction =
        await this.studentRestrictionSharedService.createRestrictionToSave(
          studentId,
          RestrictionCode.SINF,
          auditUserId,
          applicationId,
        );
      const newRestriction = await entityManager
        .getRepository(StudentRestriction)
        .save(restriction);
      await this.studentRestrictionSharedService.createNotifications(
        [newRestriction.id],
        auditUserId,
        entityManager,
      );
    }
  }
}
