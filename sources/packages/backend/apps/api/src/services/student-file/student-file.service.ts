import { Injectable } from "@nestjs/common";
import {
  DataSource,
  EntityManager,
  In,
  IsNull,
  Not,
  UpdateResult,
} from "typeorm";
import {
  RecordDataModelService,
  StudentFile,
  User,
  FileOriginType,
  NoteType,
} from "@sims/sims-db";
import { FileUploadOptions } from "./student-file.model";
import { NoteSharedService } from "@sims/services";
import { CustomNamedError } from "@sims/utilities";
import {
  STUDENT_FILE_IS_DELETED,
  STUDENT_FILE_NOT_FOUND,
} from "../../constants";

@Injectable()
export class StudentFileService extends RecordDataModelService<StudentFile> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly noteSharedService: NoteSharedService,
  ) {
    super(dataSource.getRepository(StudentFile));
  }

  /**
   * Gets a student file.
   * @param uniqueFileName unique file name (name+guid).
   * @param studentId student id.
   * @returns student file.
   */
  async getStudentFile(
    uniqueFileName: string,
    studentId?: number,
  ): Promise<StudentFile> {
    const query = this.repo
      .createQueryBuilder("studentFile")
      .select([
        "studentFile.id",
        "studentFile.fileName",
        "studentFile.virusScanStatus",
      ])
      .where("studentFile.uniqueFileName = :uniqueFileName", {
        uniqueFileName,
      });

    if (studentId) {
      query.andWhere("studentFile.student.id = :studentId", { studentId });
    }
    const studentFile = await query.getOne();
    return studentFile;
  }

  /**
   * Gets a list of student files using the unique names for search them.
   * @param studentId student id.
   * @param uniqueFileNames list of unique file names.
   * @returns student files
   */
  async getStudentFiles(
    studentId: number,
    uniqueFileNames: string[],
  ): Promise<StudentFile[]> {
    return this.repo
      .createQueryBuilder("studentFile")
      .where("studentFile.student.id = :studentId", { studentId })
      .andWhere("studentFile.uniqueFileName IN (:...uniqueFileNames)", {
        uniqueFileNames,
      })
      .select("studentFile.id")
      .addSelect("studentFile.uniqueFileName")
      .addSelect("studentFile.fileName")
      .getMany();
  }

  /**
   * Update the files submitted by the student
   * with proper data.
   * @param studentId student.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @param uniqueFileNames list of unique file names.
   * @param fileOrigin origin of the file being saved.
   * @param groupName group name of the file being save.
   * @param options file upload options.
   */
  async updateStudentFiles(
    studentId: number,
    auditUserId: number,
    uniqueFileNames: string[],
    fileOrigin: FileOriginType,
    options?: FileUploadOptions,
  ): Promise<UpdateResult> {
    let updateResult: UpdateResult;
    if (options.entityManager) {
      updateResult = await this.updateStudentFile(
        options.entityManager,
        studentId,
        auditUserId,
        uniqueFileNames,
        fileOrigin,
        options,
      );
    } else {
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        updateResult = await this.updateStudentFile(
          transactionalEntityManager,
          studentId,
          auditUserId,
          uniqueFileNames,
          fileOrigin,
          options,
        );
      });
    }

    return updateResult;
  }

  /**
   * Gets a list of student files from the student account
   * (i.e, fileOrigin is FileOriginType.Student or FileOriginType.Ministry).
   * @param studentId student id.
   * @returns student files from the student account.
   */
  async getStudentUploadedFiles(studentId: number): Promise<StudentFile[]> {
    return this.repo
      .createQueryBuilder("studentFile")
      .select([
        "studentFile.uniqueFileName",
        "studentFile.fileName",
        "studentFile.metadata",
        "studentFile.groupName",
        "studentFile.createdAt",
        "studentFile.fileOrigin",
        "creator.firstName",
        "creator.lastName",
      ])
      .innerJoin("studentFile.creator", "creator")
      .where("studentFile.student.id = :studentId", { studentId })
      .andWhere("studentFile.fileOrigin IN (:...fileOrigin)", {
        fileOrigin: [FileOriginType.Student, FileOriginType.Ministry],
      })
      .orderBy("studentFile.createdAt", "DESC")
      .getMany();
  }

  /**
   * Soft deletes an uploaded student file.
   * @param uniqueFileName unique file name (name+guid).
   * @param auditUserId user that should be considered the one causing the changes.
   * @param noteDescription note description explaining the deletion reason.
   */
  async deleteStudentUploadedFile(
    uniqueFileName: string,
    auditUserId: number,
    noteDescription: string,
  ): Promise<void> {
    const studentFile = await this.repo.findOne({
      select: {
        id: true,
        student: {
          id: true,
        },
      },
      relations: {
        student: true,
      },
      where: {
        uniqueFileName,
        fileOrigin: Not(FileOriginType.Temporary),
      },
      withDeleted: true,
    });
    if (!studentFile) {
      throw new CustomNamedError(
        "Student file not found.",
        STUDENT_FILE_NOT_FOUND,
      );
    }
    const studentId = studentFile.student.id;
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const now = new Date();
      const auditUser = { id: auditUserId } as User;
      const note = await this.noteSharedService.createStudentNote(
        studentId,
        NoteType.General,
        noteDescription,
        auditUserId,
        transactionalEntityManager,
      );
      const updateResult = await transactionalEntityManager
        .getRepository(StudentFile)
        .update(
          { id: studentFile.id, deletedAt: IsNull() },
          {
            deletionNote: note,
            deletedAt: now,
            modifier: auditUser,
            updatedAt: now,
          },
        );
      if (!updateResult.affected) {
        throw new CustomNamedError(
          "Student file is already set as deleted.",
          STUDENT_FILE_IS_DELETED,
        );
      }
    });
  }

  /**
   * Update the files submitted by the student
   * with proper data.
   * @param entityManager entity manager for a given transaction.
   * @param studentId student.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @param uniqueFileNames list of unique file names.
   * @param fileOrigin origin of the file being saved.
   * @param groupName group name of the file being save.
   * @param options file upload options.
   */
  private async updateStudentFile(
    entityManager: EntityManager,
    studentId: number,
    auditUserId: number,
    uniqueFileNames: string[],
    fileOrigin: FileOriginType,
    options?: FileUploadOptions,
  ): Promise<UpdateResult> {
    if (options?.saveFileUploadNotification) {
      await options.saveFileUploadNotification(entityManager);
    }
    return entityManager.getRepository(StudentFile).update(
      {
        student: { id: studentId },
        uniqueFileName: In(uniqueFileNames),
      },
      {
        groupName: options?.groupName,
        fileOrigin,
        metadata: options?.metadata,
        modifier: { id: auditUserId } as User,
      },
    );
  }
}
